### Deploy with serverless only

```
npm install
npm run deploy
```

### Deploy with codepipeline, continuous integration

``` powershell
#1 Create a s3 bucket and enable versioning
#2 Add the following to serverless.yml
provider:
    ###...
    deploymentBucket:
        name: <bucket name>
#2 Create a github repo and enable 'repo' and 'admin:repo_hook' permissions here https://github.com/settings/tokens
#3 Deploy
aws cloudformation deploy --template-file .\code-pipeline/code-pipeline.yml --stack-name TodosAppPipeline `  
    --parameter-overrides ApplicationName="TodosApp" ArtifactS3Bucket="<bucket name created in step 1>" `  
    GitHubOAuthToken="<token obtained in step 2>" GitHubUser="<user name of github repo owner>" `  
    GitHubRepository="<name of repo>" GitHubBranch="<branch in repo>" `  
    Email="<an email to receive notifications>" `
    --capabilities CAPABILITY_NAMED_IAM
#4 Commit changes
```

### Create a Cognito user and obtain credentials

Using the aws-cli to run these commands to get an AccessKeyId, SecretKey and SessionToken, required  
for AWS sigv4 to sign requests to make API requests:

``` powershell
$StackRegion = "us-east-2" # Region where resources were created
$UserPool = "us-east-2_XXXXXXXX" # UserPoolId in stack outputs
$AppClient = "XXXXXXXXXXXXXXXXXXXXXXXX" # AppClientId in stack outputs
$IdentityPool = "us-east-2:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" # IdentityPoolId in stack outputs
$TestEmail = "test@email.com"
$TestPassword = "Passw0rd!"

aws cognito-idp sign-up --region $StackRegion --client-id $AppClient --username $TestEmail --password $TestPassword

aws cognito-idp admin-confirm-sign-up --region $StackRegion --user-pool-id $UserPool --username $TestEmail

$AuthParams = '{\"USERNAME\":\"' + $TestEmail + '\",\"PASSWORD\":\"' + $TestPassword + '\"}'

$IdToken = aws cognito-idp admin-initiate-auth --user-pool-id $UserPool --client-id $AppClient `
    --auth-flow ADMIN_NO_SRP_AUTH --auth-parameters $AuthParams --query "AuthenticationResult.IdToken"

$login = '{\"cognito-idp.' + $StackRegion + '.amazonaws.com/' + $UserPool + '\":\"' + $IdToken + '\"}'

$IdentityId = aws cognito-identity get-id --identity-pool-id $IdentityPool --logins $login --query "IdentityId"

aws cognito-identity get-credentials-for-identity --identity-id $IdentityId  --logins $login
```

### API endpoints
  
GET /todos Returns all todos for user
GET /todos?todoId=<NUMBER> Return a specific todo
GET /todos?todoId=<NUMBER>&next=<TRUE> Returns the next page of todos beginning from specified todo

POST /todos Creates a new todo
POST /todos?todoId=<NUMBER> Modifies the specified todo

DELETE /todos?todoId=<NUMBER> Deletes the specified todo