const fs = require('fs');
const path = require('path');

const cssPath = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/globals.css';
let css = fs.readFileSync(cssPath, 'utf8');

const rootVars = `  --on-primary: #ffffff;
  --primary-container: #b1f0ce;
  --on-primary-container: #002113;
  --secondary-container: #cfebd9;
  --on-secondary-container: #091f15;
  --surface-dim: #d9d9d9;
  --surface-container-lowest: #ffffff;
  --surface-container-low: #f6f6f6;
  --surface-container: #f1f1f1;
  --surface-container-high: #ebebeb;
  --surface-container-highest: #e6e6e6;
  --on-surface: #1d1b20;
  --on-surface-variant: #49454f;
  --outline: #79747e;
  --outline-variant: #cac4d0;`;

const themeVars = `  --color-on-primary: var(--on-primary);
  --color-primary-container: var(--primary-container);
  --color-on-primary-container: var(--on-primary-container);
  --color-secondary-container: var(--secondary-container);
  --color-on-secondary-container: var(--on-secondary-container);
  --color-surface-dim: var(--surface-dim);
  --color-surface-container-lowest: var(--surface-container-lowest);
  --color-surface-container-low: var(--surface-container-low);
  --color-surface-container: var(--surface-container);
  --color-surface-container-high: var(--surface-container-high);
  --color-surface-container-highest: var(--surface-container-highest);
  --color-on-surface: var(--on-surface);
  --color-on-surface-variant: var(--on-surface-variant);
  --color-outline: var(--outline);
  --color-outline-variant: var(--outline-variant);`;

css = css.replace(
    /--surface: rgba\(255, 255, 255, 0\.7\);/, 
    `--surface: rgba(255, 255, 255, 0.7);\n${rootVars}`
);

css = css.replace(
    /--color-border: var\(--border\);/,
    `--color-border: var(--border);\n${themeVars}`
);

fs.writeFileSync(cssPath, css);
console.log('CSS updated successfully');
