# electron-vis

> An electron-vue project

#### Build Setup 构建指南

``` bash
# clone the repository 下载仓库
git clone git@github.com:loctempt/Visualization_experiment.git

# install dependencies 安装依赖
cnpm install

# serve with hot reload at localhost:9080 在localhost:9080上运行，带热重载
npm run dev

# build electron application for production 发布electron应用
npm run build


```
#### 项目结构
页面文件位于`/src/renderer/components`，其中的`SvgMap.vue`是显示地图用的组件，`LandingPage.vue`是主页文件，即应用运行时默认显示的页面，其中引用了`<svg-map>`组件用于显示地图；同时主页中包含了关于出入场折线图的所有代码。\
`/src/renderer`中，`database.js`是用于连接数据库的模块，它提供了一个方便我们连接数据库并进行相关操作的方法。\
*目前出入场人数折线图的所有代码都放在主页上，下一步准备把它也做成独立的组件，方便引用。*

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue)@[8fae476](https://github.com/SimulatedGREG/electron-vue/tree/8fae4763e9d225d3691b627e83b9e09b56f6c935) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).
