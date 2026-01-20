module.exports = {
	"*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix"],
	"*.{css,less,scss,sass}": ["prettier --write", "stylelint --fix"],
	"*.{json,md}": ["prettier --write"]
  };