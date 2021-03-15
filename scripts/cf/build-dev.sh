#!/bin/bash -el

cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../..;

usage() { echo "Usage: $0 [-b <string>]" 1>&2; exit 1; }

parse_git_branch() {
     git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/\1/'
}

SAM_S3_BUCKET="aws-sam-cli-managed-default-samclisourcebucket-1ebjs4y27amd4"
SAM_S3_PREFIX="livelot-sam"

branch_name=$(parse_git_branch)
echo "branch_name: ${branch_name}"

if [[ -z $branch_name ]] ; then
    echo "Not in a git project"
    exit 1
fi

echo "Installing node_modules"
npm install

echo "Compiling dist"
npm run build

echo "Building SAM template"

sam build --parameter-overrides "StageType=dev" "BranchName=${branch_name}"

echo "Packaging SAM template"
sam package --output-template-file packaged.yaml --s3-bucket $SAM_S3_BUCKET --s3-prefix $SAM_S3_PREFIX --region us-east-2

echo "Validating SAM template"
sam validate -t packaged.yaml

echo "Deploying SAM template"
sam deploy --template-file packaged.yaml --stack-name "livelot-sam-dev-${branch_name}" --s3-bucket $SAM_S3_BUCKET --s3-prefix $SAM_S3_PREFIX --capabilities CAPABILITY_IAM --region us-east-2 --no-confirm-changeset --parameter-overrides "StageType=dev" "BranchName=${branch_name}"

echo
echo "Great Success"
