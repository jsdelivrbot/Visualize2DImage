/* globals Stats, dat, AMI*/

// standard global variables
var controls;
var renderer;
var camera;
var statsyay;
var threeD;
//
var sceneLayer0TextureTarget;
var sceneLayer1TextureTarget;
//
var sceneLayer0;
//
var lutLayer0;
var sceneLayer1;
var meshLayer1;
var uniformsLayer1;
var materialLayer1;
var lutLayer1;
var sceneLayerMix;
var meshLayerMix;
var uniformsLayerMix;
var materialLayerMix;

var layerMix = {
    opacity1: 1.0,
};


function init() {

    function animate() {
        // render
        controls.update();

        renderFirstLayerOffScreen();

        function renderFirstLayerOffScreen() {
            const forceClear = true;
            renderer.render(sceneLayer0, camera, sceneLayer0TextureTarget, forceClear);
        }

        renderSecondLayerOffScreen();

        function renderSecondLayerOffScreen() {
            const forceClear = true;
            renderer.render(sceneLayer1, camera, sceneLayer1TextureTarget, forceClear);
        }

        mixTheLayersAndRenderItOnScreen();

        function mixTheLayersAndRenderItOnScreen() {
            renderer.render(sceneLayerMix, camera);
            statsyay.update();
        }

        requestAnimationFrame(function () {
            animate();
        });
    }

    setRenderer();

    function setRenderer() {

        createRenderer();

        function createRenderer() {
            threeD = document.getElementById('container');
            const smoothBorders = true;
            const opacity = true;
            renderer = new THREE.WebGLRenderer({
                antialias: smoothBorders,
                alpha: opacity,
            });
        }

        setupRenderer();

        function setupRenderer() {
            renderer.setSize(threeD.clientWidth, threeD.clientHeight);
            const blueBackgroundColor = 0x607d8b;
            const alpha = 1;
            renderer.setClearColor(blueBackgroundColor, alpha);
            threeD.appendChild(renderer.domElement);
        }

    }


    setStats();

    function setStats() {
        statsyay = new Stats();
        threeD.appendChild(statsyay.domElement);
    }

    setScene();

    function setScene() {
        sceneLayer0 = new THREE.Scene();
        sceneLayer1 = new THREE.Scene();
        sceneLayerMix = new THREE.Scene();
    }

    renderFirstLayerAsTexture();

    function renderFirstLayerAsTexture() {
        sceneLayer0TextureTarget = new THREE.WebGLRenderTarget(threeD.clientWidth, threeD.clientHeight, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
        });
    }

    renderSecondLayerAsTexture();

    function renderSecondLayerAsTexture() {
        sceneLayer1TextureTarget = new THREE.WebGLRenderTarget(threeD.clientWidth, threeD.clientHeight, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
        });
    }

    setCamera();

    function setCamera() {
        const left = threeD.clientWidth / -2;
        const right = threeD.clientWidth / 2;
        const top = threeD.clientHeight / 2;
        const bottom = threeD.clientHeight / -2;
        const near = 0.1;
        const far = 10000;
        camera = new AMI.OrthographicCamera(
            left,
            right,
            top,
            bottom,
            near,
            far
        );
    }


    setControls();

    function setControls() {
        controls = new AMI.TrackballOrthoControl(camera, threeD);
        const smoothMove = true;
        controls.staticMoving = smoothMove;
        controls.noRotate = true;
        camera.controls = controls;
    }


    animate();
}

init();

var {rawgit, dataFullPath} = setData();

function setData() {
    var data = [
        '000183.dcm',
        '000219.dcm',
        '000117.dcm',
        '000240.dcm',
        '000033.dcm',
        '000060.dcm',
        '000211.dcm',
        '000081.dcm',
        '000054.dcm',
        '000090.dcm',
        '000042.dcm',
        '000029.dcm',
        '000239.dcm',
        '000226.dcm',
        '000008.dcm',
        '000128.dcm',
        '000089.dcm',
        '000254.dcm',
        '000208.dcm',
        '000047.dcm',
        '000067.dcm'
    ];

    var rawgit = 'https://cdn.rawgit.com/FNNDSC/data/master/dicom/andrei_abdomen/';

    var dataFullPath = data.map(function (currentData) {
        return rawgit + 'data/' + currentData;
    });
    return {rawgit, dataFullPath};
}


var labelmapFullPath = setLabelMap();

function setLabelMap() {
    var labelmap = ['000000.dcm'];

    var labelmapFullPath = labelmap.map(function (currentData) {
        return rawgit + 'segmentation/' + currentData;
    });
    return labelmapFullPath;
}


var files = dataFullPath.concat(labelmapFullPath);

var loader = loadAndParseData();

function loadAndParseData() {
    var loader = new AMI.VolumeLoader(threeD);
    return loader;
}

function buildGUI(stackHelper) {

    function updateLayer1() {
        if (meshLayer1) {
            bundleSlicesToMesh();
        }
    }

    function bundleSlicesToMesh() {
        meshLayer1.geometry.dispose();
        meshLayer1.geometry = stackHelper.slice.geometry;
        meshLayer1.geometry.verticesNeedUpdate = true;
    }


    /**
     * Update layer mix
     */

// update layer1 geometry...
    function updateLayerMix() {


        if (meshLayerMix) {
            resetLayerMix();

            function resetLayerMix() {
                sceneLayerMix.remove(meshLayerMix);
                meshLayerMix.material.dispose();
                meshLayerMix.material = null;
                meshLayerMix.geometry.dispose();
                meshLayerMix.geometry = null;
            }

            addMeshToLayerMix();

            function addMeshToLayerMix() {
                const geometry = stackHelper.slice.geometry;
                const material = materialLayerMix;
                meshLayerMix = new THREE.Mesh(geometry, material);
            }


            convertCoordinateSystemFromIJKToLeftPosteriorSuperior();

            function convertCoordinateSystemFromIJKToLeftPosteriorSuperior() {
                meshLayerMix.applyMatrix(stackHelper.stack._ijk2LPS);
            }

            sceneLayerMix.add(meshLayerMix);
        }
    }

    var {stack, gui} = createGui();

    function createGui() {
        var stack = stackHelper.stack;

        var gui = new dat.GUI({
            autoPlace: false,
        });
        return {stack, gui};
    }


    setGuiIntoDOM();

    function setGuiIntoDOM() {
        var customContainer = document.getElementById('my-gui-container');
        customContainer.appendChild(gui.domElement);
    }


    var layer0Folder = createCTPanel();

    function createCTPanel() {
        const CTLabel = 'CT';
        var layer0Folder = gui.addFolder(CTLabel);
        return layer0Folder;
    }


    setInvertCheckBox();

    function setInvertCheckBox() {
        layer0Folder.add(stackHelper.slice, 'invert');
    }


    setColorSchemasDropDown();

    function setColorSchemasDropDown() {


        var lutUpdate = layer0Folder.add(stackHelper.slice, 'lut', lutLayer0.lutsAvailable());
        lutUpdate.onChange(function (value) {
            lutLayer0.lut = value;
            stackHelper.slice.lutTexture = lutLayer0.texture;
        });
    }

    setIndexSlider();

    function setIndexSlider() {
        const min = 0;
        const max = stack.dimensionsIJK.z - 1;
        var indexUpdate = layer0Folder
            .add(stackHelper, 'index', min, max)
            .step(1)
            .listen();

        indexUpdate.onChange(function () {
            updateLayer1();
            updateLayerMix();
        });
    }


    setInterpolationSlider();

    function setInterpolationSlider() {
        layer0Folder
            .add(stackHelper.slice, 'interpolation', 0, 1)
            .step(1)
            .listen();
    }


    layer0Folder.open();

    var layerMixFolder = setSegmentationPanel();

    function setSegmentationPanel() {
        var layerMixFolder = gui.addFolder('Segmentation');
        return layerMixFolder;
    }


    setOpacitySlider();

    function setOpacitySlider() {
        const min = 0;
        const max = 1;
        var opacityLayerMix1 = layerMixFolder.add(layerMix, 'opacity1', min, max).step(0.01);
        opacityLayerMix1.onChange(function (value) {
            uniformsLayerMix.uOpacity1.value = value;
        });
    }


    layerMixFolder.open();

    addScrollControlToChangeCurrentSlice();

    function addScrollControlToChangeCurrentSlice() {
        controls.addEventListener('OnScroll', function (e) {
            if (e.delta > 0) {
                if (stackHelper.index >= stack.dimensionsIJK.z - 1) {
                    return false;
                }
                stackHelper.index += 1;
            } else {
                if (stackHelper.index <= 0) {
                    return false;
                }
                stackHelper.index -= 1;
            }

            updateLayer1();
            updateLayerMix();
        });
    }

    updateLayer1();
    updateLayerMix();


    function onWindowResize() {
        var threeD = document.getElementById('container');
        camera.canvas = {
            width: threeD.clientWidth,
            height: threeD.clientHeight,
        };
        const directionsUsedToResizeImage = 2;
        camera.fitBox(directionsUsedToResizeImage);

        renderer.setSize(threeD.clientWidth, threeD.clientHeight);
    }

    const useCaptureToExecuteEventOnWindowLoad = false;
    window.addEventListener('resize', onWindowResize, useCaptureToExecuteEventOnWindowLoad);
    onWindowResize();
}

function handleSeries() {

    var {mergedSeries, stack, stack2} = setStack();

    function setStack() {
        var mergedSeries = loader.data[0].mergeSeries(loader.data);
        var stack = mergedSeries[0].stack[0];
        var stack2 = mergedSeries[1].stack[0];
        return {mergedSeries, stack, stack2};
    }

    closeLoader();

    function closeLoader() {
        loader.free();
        loader = null;
    }


    if (isImageSegmented()) {
        stack = mergedSeries[0].stack[0];
        stack2 = mergedSeries[1].stack[0];
    }

    function isImageSegmented() {
        return stack.modality === 'SEG';
    }

    var stackHelper = setStackHelper();

    function setStackHelper() {
        var stackHelper = new AMI.StackHelper(stack);
        stackHelper.bbox.visible = false;
        stackHelper.border.visible = false;
        stackHelper.index = 10;

        sceneLayer0.add(stackHelper);
        return stackHelper;
    }


    var textures2 = setTextureFromRawData();

    function setTextureFromRawData() {
        stack2.prepare();
        stack2.pack();

        var textures2 = [];
        for (var m = 0; m < stack2._rawData.length; m++) {
            var tex = new THREE.DataTexture(
                stack2.rawData[m],
                stack2.textureSize,
                stack2.textureSize,
                stack2.textureType,
                THREE.UnsignedByteType,
                THREE.UVMapping,
                THREE.ClampToEdgeWrapping,
                THREE.ClampToEdgeWrapping,
                THREE.NearestFilter,
                THREE.NearestFilter
            );
            tex.needsUpdate = true;
            tex.flipY = true;
            textures2.push(tex);
        }
        return textures2;
    }

    setShaderUsingTexturePositionColorBorder();

    function setShaderUsingTexturePositionColorBorder() {
        uniformsLayer1 = AMI.DataUniformShader.uniforms();
    }

    setShaderTextureSize();

    function setShaderTextureSize() {
        uniformsLayer1.uTextureSize.value = stack2.textureSize;
    }

    setShaderTextureContainer();

    function setShaderTextureContainer() {
        uniformsLayer1.uTextureContainer.value = textures2;
    }

    convertLeftPosteriorSuperiorDICOMCorrdinatesTo2DWorldCoordinates();

    function convertLeftPosteriorSuperiorDICOMCorrdinatesTo2DWorldCoordinates() {
        uniformsLayer1.uWorldToData.value = stack2.lps2IJK;
    }

    setShaderTextureNumberOfChannels();

    function setShaderTextureNumberOfChannels() {
        uniformsLayer1.uNumberOfChannels.value = stack2.numberOfChannels;
    }

    setShaderTexturePixelTypeAsIntOrFloat();

    function setShaderTexturePixelTypeAsIntOrFloat() {
        uniformsLayer1.uPixelType.value = stack2.pixelType;
    }

    setAllocatedBits();

    function setAllocatedBits() {
        uniformsLayer1.uBitsAllocated.value = stack2.bitsAllocated;
    }

    setShaderTextureCenter();

    function setShaderTextureCenter() {
        const windowCenter = stack2.windowCenter;
        const windowWidth = stack2.windowWidth;
        uniformsLayer1.uWindowCenterWidth.value = [windowCenter, windowWidth];
    }

    setShaderTextureRescaleSlope();

    function setShaderTextureRescaleSlope() {
        const rescaleSlope = stack2.rescaleSlope;
        const rescaleIntercept = stack2.rescaleIntercept;
        uniformsLayer1.uRescaleSlopeIntercept.value = [rescaleSlope, rescaleIntercept];
    }

    setShaderTextureDataDimensions();

    function setShaderTextureDataDimensions() {
        const xDimension = stack2.dimensionsIJK.x;
        const yDimension = stack2.dimensionsIJK.y;
        const zDimension = stack2.dimensionsIJK.z;
        uniformsLayer1.uDataDimensions.value = [xDimension, yDimension, zDimension];
    }

    setShaderTextureInterpolationMode();

    function setShaderTextureInterpolationMode() {
        uniformsLayer1.uInterpolation.value = 0;
    }


    createShadersToRepresentSegment();

    function createShadersToRepresentSegment() {
        var fs = new AMI.DataFragmentShader(uniformsLayer1);
        var vs = new AMI.DataVertexShader();
        materialLayer1 = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            uniforms: uniformsLayer1,
            vertexShader: vs.compute(),
            fragmentShader: fs.compute(),
        });
    }

    createMeshWIthShaders();

    function createMeshWIthShaders() {
        meshLayer1 = new THREE.Mesh(stackHelper.slice.geometry, materialLayer1);
    }

    convertToLeftPosteriorSuperiorDICOMCorrdinates();

    function convertToLeftPosteriorSuperiorDICOMCorrdinates() {
        meshLayer1.applyMatrix(stack._ijk2LPS);
    }

    sceneLayer1.add(meshLayer1);

    createMixLayer();

    function createMixLayer() {
        uniformsLayerMix = AMI.LayerUniformShader.uniforms();
        uniformsLayerMix.uTextureBackTest0.value = sceneLayer0TextureTarget.texture;
        uniformsLayerMix.uTextureBackTest1.value = sceneLayer1TextureTarget.texture;

        let fls = new AMI.LayerFragmentShader(uniformsLayerMix);
        let vls = new AMI.LayerVertexShader();
        materialLayerMix = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            uniforms: uniformsLayerMix,
            vertexShader: vls.compute(),
            fragmentShader: fls.compute(),
            transparent: true,
        });
    }

    createMeshMixLayer();

    function createMeshMixLayer() {
        meshLayerMix = new THREE.Mesh(stackHelper.slice.geometry, materialLayer1);
    }

    convertMixLayerToLPSDICOMCoordinates();

    function convertMixLayerToLPSDICOMCoordinates() {
        meshLayerMix.applyMatrix(stack._ijk2LPS);
    }

    sceneLayerMix.add(meshLayerMix);

    var lpsDims = setCamera();

    function setCamera() {
        var worldbb = stack.worldBoundingBox();
        const widthLPSDimension = worldbb[1] - worldbb[0];
        const heightLPSDimension = worldbb[3] - worldbb[2];
        const depthLPSDimension = worldbb[5] - worldbb[4];
        var lpsDims = new THREE.Vector3(widthLPSDimension, heightLPSDimension, depthLPSDimension);
        return lpsDims;
    }

    // box: {halfDimensions, center}
    var box = {
        center: stack.worldCenter().clone(),
        halfDimensions: new THREE.Vector3(lpsDims.x + 10, lpsDims.y + 10, lpsDims.z + 10)
    };

    // init and zoom
    var canvas = {
        width: threeD.clientWidth,
        height: threeD.clientHeight,
    };
    camera.directions = [stack.xCosine, stack.yCosine, stack.zCosine];
    camera.box = box;
    camera.canvas = canvas;
    camera.update();
    camera.fitBox(2);

    // CREATE LUT
    lutLayer0 = new AMI.LutHelper(
        'my-lut-canvases-l0',
        'default',
        'linear',
        [[0, 0, 0, 0], [1, 1, 1, 1]],
        [[0, 1], [1, 1]]
    );
    lutLayer0.luts = AMI.LutHelper.presetLuts();

    lutLayer1 = new AMI.LutHelper(
        'my-lut-canvases-l1',
        'default',
        'linear',
        stack2.segmentationLUT,
        stack2.segmentationLUTO,
        true
    );
    uniformsLayer1.uLut.value = 1;
    uniformsLayer1.uTextureLUT.value = lutLayer1.texture;

    buildGUI(stackHelper);
}

loader
    .load(files)
    .then(function () {
        handleSeries();
    })
    .catch(function (error) {
        window.console.log('oops... something went wrong...');
        window.console.log(error);
    });
