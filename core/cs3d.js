/**
 * 展示新物品进行 3D 模型渲染
*/

// 场景设置
let scene, camera, renderer, controls;
let model;
let currentTextures = {};

// 贴图数据缓存
let paintData = null;

// 模型基础路径
const modelBasePath = 'models/weapons/models/';             // 新模型路径
const legacyModelBasePath = 'models/weapons/legacyModels/'; // 旧模型路径

// 监听事件，展示新物品
window.addEventListener('showNewItem', (event) => {
    console.log("收到了消息", event.detail);
    if (event.detail && event.detail.name) {
        loadItemByName(event.detail.name, event.detail.legacy_model);
    }
});

// 根据名称加载物品
async function loadItemByName(itemName, legacy_model) {
    try {
        console.log("开始加载物品:", itemName);

        // 加载数据文件
        await loadDataFiles();

        // 检查数据是否存在
        if (!paintData || !paintData[itemName]) {
            console.error('未找到物品数据:', itemName);
            return;
        }

        // 查询贴图数据
        const textureData = paintData[itemName].texture_url;
        if (!textureData) {
            console.error('未找到贴图数据:', itemName);
            return;
        }

        // 获取模型文件名
        const modelFileName = paintData[itemName].model_name;
        if (!modelFileName) {
            console.error('未找到模型文件名:', itemName);
            return;
        }

        console.log("模型文件名:", modelFileName);
        console.log("贴图数据:", textureData);

        // 初始化场景
        init3D();

        // 加载模型和贴图
        await loadModelWithTextures(modelFileName, textureData, legacy_model);

        console.log("物品加载完成");

    } catch (error) {
        console.error('加载物品时出错:', error);
    }
}

// 加载模型和贴图
function loadModelWithTextures(modelFileName, textureUrls, legacy_model) {
    return new Promise((resolve, reject) => {
        const loader = new THREE.OBJLoader();
        const modelPath = `${legacy_model ? legacyModelBasePath : modelBasePath}${modelFileName}.obj`;

        console.log("加载模型路径:", modelPath);

        loader.load(modelPath, function (obj) {
            console.log("模型加载成功");
            model = obj;

            // 调整相机位置以适合模型
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // 计算合适的相机距离
            const maxDim = 8;
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));

            camera.position.set(center.z + cameraZ, center.y, center.x);
            controls.update();

            // 设置模型位置和缩放
            model.position.set(-center.x, -center.y, -center.z);
            model.scale.set(1, 1, 1);

            // 创建材质并应用所有贴图
            createPBRMaterial(textureUrls).then(material => {
                console.log("应用贴图");

                // 遍历模型的所有网格，应用材质
                model.traverse(function (child) {
                    if (child.isMesh) {
                        child.material = material;
                        child.castShadow = true;
                        child.receiveShadow = true;
                        console.log("应用材质到网格");
                    }
                });

                scene.add(model);
                console.log("模型添加到场景");

                resolve();
            }).catch(error => {
                console.error('创建材质时出错:', error);
                reject(error);
            });

        }, function (progress) {
            console.log("模型加载进度:", (progress.loaded / progress.total * 100) + '%');
        }, function (error) {
            console.error('加载模型时出错:', error);
            reject(error);
        });
    });
}

// 创建PBR材质
function createPBRMaterial(textureUrls) {
    return new Promise((resolve, reject) => {
        const textureLoader = new THREE.TextureLoader();
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0.2
        });

        let texturesLoaded = 0;
        const totalTextures = Object.keys(textureUrls).length;

        console.log("开始加载贴图，总数:", totalTextures);

        // 清理之前的贴图
        currentTextures = {};

        function checkAllTexturesLoaded() {
            texturesLoaded++;
            console.log(`贴图加载进度: ${texturesLoaded}/${totalTextures}`);

            if (texturesLoaded === totalTextures) {
                console.log("所有贴图加载完成");
                material.needsUpdate = true;
                resolve(material);
            }
        }

        // 加载基础颜色贴图
        if (textureUrls.color_texture) {
            console.log("加载颜色贴图:", textureUrls.color_texture);
            textureLoader.load(textureUrls.color_texture, function (texture) {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                material.map = texture;
                currentTextures.color = texture;
                console.log("颜色贴图加载成功");
                checkAllTexturesLoaded();
            }, undefined, function (error) {
                console.error('加载颜色贴图时出错:', error);
                reject(error);
            });
        } else {
            console.log("跳过颜色贴图");
            checkAllTexturesLoaded();
        }

        // 加载法线贴图
        if (textureUrls.normal_texture) {
            console.log("加载法线贴图:", textureUrls.normal_texture);
            textureLoader.load(textureUrls.normal_texture, function (texture) {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                material.normalMap = texture;
                material.normalScale.set(1, 1);
                currentTextures.normal = texture;
                console.log("法线贴图加载成功");
                checkAllTexturesLoaded();
            }, undefined, function (error) {
                console.error('加载法线贴图时出错:', error);
                reject(error);
            });
        } else {
            console.log("跳过了法线贴图");
            checkAllTexturesLoaded();
        }

        // 加载环境光遮蔽贴图
        if (textureUrls.ao_texture) {
            console.log("加载AO贴图:", textureUrls.ao_texture);
            textureLoader.load(textureUrls.ao_texture, function (texture) {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                material.aoMap = texture;
                currentTextures.ao = texture;
                console.log("AO贴图加载成功");
                checkAllTexturesLoaded();
            }, undefined, function (error) {
                console.error('加载AO贴图时出错:', error);
                reject(error);
            });
        } else {
            console.log("跳过AO贴图");
            checkAllTexturesLoaded();
        }

        // 加载其他贴图（w, x, y, z）
        ['w_texture', 'x_texture', 'y_texture', 'z_texture'].forEach(textureKey => {
            if (textureUrls[textureKey]) {
                console.log(`加载${textureKey}:`, textureUrls[textureKey]);
                textureLoader.load(textureUrls[textureKey], function (texture) {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    currentTextures[textureKey] = texture;
                    console.log(`${textureKey}加载成功`);
                    checkAllTexturesLoaded();
                }, undefined, function (error) {
                    console.error(`加载${textureKey}时出错:`, error);
                    reject(error);
                });
            } else {
                console.log(`跳过${textureKey}`);
                checkAllTexturesLoaded();
            }
        });
    });
}

// 初始化函数
function init3D() {
    // 如果场景已存在，先清理
    if (scene) {
        cleanupScene();
    } else {
        // 停止之前的动画循环
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    // 创建场景
    scene = new THREE.Scene();
    scene.background = null;

    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // 创建渲染器
    if (!renderer) {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerHeight, window.innerHeight * 0.53);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.physicallyCorrectLights = true;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        renderer.setClearColor(0x000000, 0);

        document.getElementById('cs3d').appendChild(renderer.domElement);
    }

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLightA = new THREE.DirectionalLight(0xffffff, 3);
    directionalLightA.position.set(10, 10, 10);
    directionalLightA.castShadow = true;
    scene.add(directionalLightA);

    const directionalLightB = new THREE.DirectionalLight(0xffffff, 3);
    directionalLightB.position.set(-10, -5, -10);
    directionalLightB.castShadow = true;
    scene.add(directionalLightB);

    const directionalLightC = new THREE.DirectionalLight(0xffffff, 1);
    directionalLightC.position.set(0, 10, 0);
    directionalLightC.castShadow = true;
    scene.add(directionalLightC);

    // const axisHelper = new THREE.AxesHelper(20);
    // scene.add(axisHelper);

    // 重置轨道控制器
    if (controls) {
        controls.dispose();
        controls = null;
    }

    // 创建新的轨道控制器
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;

    // 设置旋转角度限制
    controls.minPolarAngle = 3 * Math.PI / 8; // 最小俯仰角
    controls.maxPolarAngle = 5 * Math.PI / 8; // 最大俯仰角

    // 窗口大小变化时调整渲染器
    window.addEventListener('resize', onWindowResize);

    // 开始动画循环
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    animate3D();
}

// 清理场景
function cleanupScene() {
    console.log("开始清理场景");

    // 停止动画循环
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    // 清理模型
    if (model) {
        console.log("清理模型");
        model.traverse(function (child) {
            if (child.isMesh) {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
        scene.remove(model);
        model = null;
    }

    // 清理材质和贴图
    if (currentTextures) {
        console.log("清理贴图");
        Object.values(currentTextures).forEach(texture => {
            if (texture && texture.dispose) {
                texture.dispose();
            }
        });
        currentTextures = {};
    }

    // 清理场景中的所有对象
    console.log("清理场景对象");
    while (scene.children.length > 0) {
        const object = scene.children[0];
        if (object.isMesh) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        }
        scene.remove(object);
    }

    // 清理控制器
    if (controls) {
        controls.dispose();
        controls = null;
    }

    console.log("场景清理完成");
}

// 提取武器类型
function extractWeaponType(itemName) {
    // 从物品名称中提取武器部分，例如 "AK-47 | 流金王朝" -> "weapon_ak47"
    const parts = itemName.split(' | ');
    if (parts.length > 0) {
        const weaponName = parts[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        return `weapon_${weaponName}`;
    }
    return null;
}

// 加载数据文件
async function loadDataFiles() {
    if (!paintData) {
        const paintResponse = await fetch('../data/json/paint.json');
        paintData = await paintResponse.json();
    }
}

let animationId = null;

function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerHeight, window.innerHeight * 0.53);
    }
}

function animate3D() {
    animationId = requestAnimationFrame(animate3D);
    if (controls) {
        controls.update();
    }
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}