function continueNewItem() {
    document.getElementById('new-item').style.display = 'none';
}

function showNewItem(color, name, img) {
    continueNewItem();
    document.getElementById('new-item-video').currentTime = 0;
    document.getElementById('new-item').style.display = 'block';
    document.getElementById('new-item-bar').style.backgroundColor = color;
    document.getElementById('new-item-video-mask').style.backgroundColor = color;
    document.getElementById('new-item-title').style.color = color;
    document.getElementById('new-item-name').innerHTML = name;
    document.getElementById('new-item-image-src').src = img;
}