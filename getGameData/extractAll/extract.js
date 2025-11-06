// csTools/VirtualInventory/all.json

const fs = require('fs');

// 读取 all.json 文件
fs.readFile('csTools/VirtualInventory/all.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading all.json:', err);
    return;
  }

  try {
    // 解析 JSON 数据
    const jsonData = JSON.parse(data);

    // 创建一个空对象来存储分类后的数据
    const tabel = {};

    // 遍历原始数据中的每个条目
    for (const key in jsonData) {
      if (jsonData.hasOwnProperty(key)) {
        const item = jsonData[key];
        const { id, name, rarity } = item;

        // 检查 name 是否存在
        if (!name) {
          console.warn(`Skipping item with key ${key}: name is undefined`);
          continue;
        }

        // 处理 skin 前缀的数据
        if (key.startsWith('skin-')) {
          // 解析 name 字段
          const nameParts = name.split(' | ');

          // 检查 nameParts 是否符合预期格式
          if (nameParts.length < 2) {
            console.warn(`Skipping skin item with key ${key}: invalid name format`);
            continue;
          }

          let weaponName = nameParts[0].trim(); // 提取武器名称

          // 去除子类信息（例如 StatTrak™、Souvenir 等）
          weaponName = weaponName.replace(/（[^）]+）/, '').trim(); // 去除中文括号及其内容
          weaponName = weaponName.replace(/\([^)]+\)/, '').trim(); // 去除英文括号及其内容

          const skinName = nameParts[1].split(' (')[0].trim(); // 提取皮肤名称

          // 如果 skin 分类不存在，初始化一个空对象
          if (!tabel.skin) {
            tabel.skin = {};
          }

          // 如果武器名称不存在，初始化一个空数组
          if (!tabel.skin[weaponName]) {
            tabel.skin[weaponName] = [];
          }

          // 检查是否已存在相同的皮肤名称
          const existingSkin = tabel.skin[weaponName].find(
            (skin) => skin.skinName === `${weaponName} | ${skinName}`
          );

          // 如果不存在相同的皮肤名称，则添加到数组中
          if (!existingSkin) {
            tabel.skin[weaponName].push({
              skinName: `${weaponName} | ${skinName}`, // 输出格式为 "weaponName | skinName"
              skinId: id.split('_')[0], // 提取 skinId（去掉后缀，如 _0, _1）
              color: rarity?.color || '#ccc', // 新增 rarity.color 字段，如果不存在则默认为黑色
            });
          }
        } else {
          // 处理其他前缀的数据
          const prefix = id.split('-')[0]; // 提取前缀
          if (!tabel[prefix]) {
            tabel[prefix] = {}; // 如果前缀不存在，初始化一个空对象
          }
          tabel[prefix][id] = {
            id,
            name,
            color: rarity?.color || '#ccc', // 新增 rarity.color 字段，如果不存在则默认为黑色
          };
        }
      }
    }

    // 将分类后的数据保存到 tabel.json 文件中
    fs.writeFile('csTools/VirtualInventory/tabel.json', JSON.stringify(tabel, null, 2), (err) => {
      if (err) {
        console.error('Error writing tabel.json:', err);
      } else {
        console.log('Data successfully saved to tabel.json');
      }
    });
  } catch (parseError) {
    console.error('Error parsing JSON:', parseError);
  }
});