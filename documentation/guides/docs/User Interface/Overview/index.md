# User Interface
A majority of the modifications made to the Policy Table are done through SQL database queries. To make this easier, the Policy Server has a user interface that can be found by navigating to <a href="http://localhost:3000/">http://localhost:3000/</a> in a browser of your choice. There are four main pages to the Policy Server.

[Applications](../applications/)

[View Policy Table](../view-policy-table/)

[Functional Groupings](../messages-and-functional-groups/)

[Consumer Friendly Messages](../messages-and-functional-groups/)

## Vue.js
<a href="https://vuejs.org/v2/guide/">Vue.js</a> is an open source JavaScript framework which the Policy Server uses in building the user interface. It allows the creation of multiple components of a similar structure. For the Policy Server, the larger components for building each page exist in the /src/components directory while the smaller and more numerous items are located in the /common subdirectory. Any files related to styling such as <a href="https://developer.mozilla.org/en-US/docs/Web/CSS">CSS</a>, text fonts, and images, are in the /assets subdirectory. The basic HTML for the user interface can be found in the /ui/raw directory.
## Webpack
The Policy Server is an open source project giving the user the ability to customize the project to his/her specific needs. <a href="https://webpack.js.org/concepts/">Webpack</a> is used to bundle the files into a build and then the build files are exectued. Currently, if any changes are made to the files then before restarting the server the build commmand, found in the package.json, must be run in the terminal so as to rebuild the project with the changes. The /build folder contains all files associated with <a href="https://webpack.js.org/concepts/">Webpack</a>.