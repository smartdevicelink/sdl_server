Occasionally, you may receive a banner on the bottom of the Policy Server UI indicating an update is available. When this occurs, we recommend following the update procedure below to ensure your version of the Policy Server is up-to-date with the latest patches and features.

First, use Git to pull the latest version of the Policy Server:
```
git pull
```

Then, update NPM modules with:
```
npm update
```

Finally, start the server using the typical method:
```
npm run start-pg-staging
```
or
```
npm run start-pg-production
```

Verify that it started properly by navigating to <a href="http://localhost:3000/">`http://localhost:3000/`</a>

Now your updated Policy Server is up and running!
