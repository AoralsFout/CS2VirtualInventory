## 项目介绍

这是一个基于 JavaScript 高仿 Counter-Skrike 2 库存的项目。

## 启动项目

使用浏览器打开 index.html 文件即可启动项目。  
注意：您需要在浏览器里设置允许自动播放视频，否则启动动画会出现问题

## 功能介绍

- 通过 INS 键调出菜单，支持添加、删除库存物品，设置用户头像

## 未来计划

- 加载、保存库存存档的功能
- 模拟开箱
- 模拟汰换
- 新物品入库检视
- 物品检视
- 模拟控制台
- 完善其他页面

## 数据获取

数据来自于 CSGO-API : https://github.com/ByMykel/CSGO-API  
我写的自动获取数据脚本仍有问题，需要手动通过 CSGO-API 获取数据。

### images文件夹

除了四张图片外，还应有 **icon** , **panorama** 文件夹，他们的结构见下文 **images文件夹结构**

### getGameData文件夹

其中的json文件夹应有 **all.json** 和 **tabel.json**  

**tabel.json** 是通过 **extract.js** 从 **all.json** 中提取的信息。

## images文件夹结构

images  
├── icon    游戏主页面svg图标  
└── panorama  
    └── images  
        └── econ  
            └── characters  
            └── default_generated  
            └── keychains   
            └── music_kits   
            └── patches   
            └── premier_seasons   
            └── season_icons       
            └── set_icons     
            └── status_icons    
            └── stickers    
            └── tools      
            └── tournaments   
            └── weapon_cases   
            └── weapons   
            └── wearables    
    └──panorama \ images \ econ \ wearables \ gloves   
