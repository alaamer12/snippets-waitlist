@echo off
echo Initializing Git repository...
git init

echo Adding files...
git add .

echo Creating initial commit...
git commit -m "Initial commit"

echo Please enter your GitHub username:
set /p username=

echo Creating GitHub repository...
gh repo create %username%/snippets-waitlist --public --source=. --remote=origin --push

echo Configuring GitHub Pages...
git checkout -b gh-pages
git push origin gh-pages

echo Done! Your site will be available at: https://%username%.github.io/snippets-waitlist
echo Note: It might take a few minutes for the site to be accessible.
pause
