# Check new package licenses

A github action to comment on newly added packages to `package.json` or `requirements.txt` files like this:

![image](https://user-images.githubusercontent.com/112956709/206563597-6c5eeee4-c9d6-47ab-b4e5-36b44e6d1f8b.png)

Configuration:

1. Create a github workflow file (.github/workflows)
2. Configure a job to check licenses:

```yaml
  CheckLicenses:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check licenses of new packages
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        uses: oncai/check-licenses@v1
        with:
          dependency-file: path/to/package.json
          message-file: ./new-package-warning.md
```

3. Add a markdown Mustache template to be used for comments. E.g. `new-package-warning.md`:

```markdown
New package: **{{name}}**

version: **{{version}}**
license: **{{license}}**
homepage: {{{homepage}}}
```


