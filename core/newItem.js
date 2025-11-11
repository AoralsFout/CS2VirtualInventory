function continueNewItem() {
    document.getElementById('new-item').style.display = 'none';
}

function showNewItem(color, name, legacy_model) {
    continueNewItem();
    const noWareName = name.split(' (')[0].replace(/\s/g,'');
    const e = new CustomEvent('showNewItem',{
        bubbles: true,
        cancelable: true,
        detail: {
            name: noWareName,
            legacy_model,
        }
    });
    document.dispatchEvent(e);
    document.getElementById('inventory_new_item_01').currentTime = 0;
    document.getElementById('inventory_new_item_01').play();
    document.getElementById('new-item-video').currentTime = 0;
    document.getElementById('new-item').style.display = 'block';
    document.getElementById('new-item-bar').style.backgroundColor = color;
    document.getElementById('new-item-video-mask').style.backgroundColor = color;
    document.getElementById('new-item-title').style.color = color;
    document.getElementById('new-item-name').innerHTML = name;
}