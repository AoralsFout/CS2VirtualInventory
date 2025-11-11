/**
 * 展示新物品相关
*/

function continueNewItem() {
    document.getElementById('new-item').style.display = 'none';
}

function showNewItem(type, color, name, legacy_model_OR_image_url) {
    continueNewItem();
    if (type === "SKIN") {
        document.getElementById('cs3d').style.display = 'block';
        document.getElementById('new-item-image').style.display = 'none';
        const noWareName = name.split(' (')[0].replace(/\s/g, '');
        const e = new CustomEvent('showNewItem', {
            bubbles: true,
            cancelable: true,
            detail: {
                name: noWareName,
                legacy_model: legacy_model_OR_image_url,
            }
        });
        document.dispatchEvent(e);
    } else {
        document.getElementById('new-item-image').style.display = 'block';
        document.getElementById('cs3d').style.display = 'none';
        document.getElementById('new-item-image').src = legacy_model_OR_image_url;
    }
    document.getElementById('inventory_new_item_01').currentTime = 0;
    document.getElementById('inventory_new_item_01').play();
    document.getElementById('new-item-video').currentTime = 0;
    document.getElementById('new-item').style.display = 'block';
    document.getElementById('new-item-bar').style.backgroundColor = color;
    document.getElementById('new-item-video-mask').style.backgroundColor = color;
    document.getElementById('new-item-title').style.color = color;
    document.getElementById('new-item-name').innerHTML = name;
}