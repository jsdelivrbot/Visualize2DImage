var {container, renderer} = setupRenderer();

var scene = setupScene();


var camera = setupCamera();


var controls = setupControlls();


function onWindowResize() {
    camera.aspect = container.offsetWidth / container.offsetHeight;
    updateProjectionMatrixToDetermineHowToDisplay3DDataas2DImage();
    renderer.setSize(container.offsetWidth, container.offsetHeight);

    function updateProjectionMatrixToDetermineHowToDisplay3DDataas2DImage() {
        camera.updateProjectionMatrix();
    }
}

window.addEventListener('resize', onWindowResize, false);


function gui(stackHelper) {

    var {stack, gui} = createGui();

    function createGui() {
        var stack = stackHelper.stack;
        var gui = new dat.GUI({
            autoPlace: false,
        });
        const guiElementId = 'my-gui-container';
        var customContainer = document.getElementById(guiElementId);
        customContainer.appendChild(gui.domElement);
        return {stack, gui};
    }

    var {stackFolder, index, orientation} = createStackPanel();

    function createStackPanel() {
        const stackGuiLabel = 'Stack';
        var stackFolder = gui.addFolder(stackGuiLabel);

        const indexGuiLabel = 'index';
        var index = createIndexSlider();

        function createIndexSlider() {
            const min = 0;
            const max = stack.dimensionsIJK.z - 1;

            var index = stackFolder
                .add(stackHelper, indexGuiLabel, min, max)
                .step(1)
                .listen();

            return index;
        }

        var orientation = createOrientationSlider();

        function createOrientationSlider() {
            const orientationGuiLabel = 'orientation';
            const orientationMin = 0;
            const orientationMax = 2;

            var orientation = stackFolder
                .add(stackHelper, orientationGuiLabel, orientationMin, orientationMax)
                .step(1)
                .listen();

            return orientation;
        }

        return {stackFolder, index, orientation};
    }

    addOrientationEventListener();

    function addOrientationEventListener() {
        orientation.onChange(function () {
            index.__max = stackHelper.orientationMaxIndex;
            const centerIndexSliderOnGuiFormula = Math.floor(index.__max / 2);
            stackHelper.index = centerIndexSliderOnGuiFormula;
        });
    }

    stackFolder.open();


    createSlicePanel();

    function createSlicePanel() {
        var sliceFolder = gui.addFolder('Slice');

        createWindowWidthSlider();

        function createWindowWidthSlider() {
            const vindowWidthGuiLabel = 'windowWidth';
            const minWindowWidth = 1;
            const maxWindowWidth = stack.minMax[1] - stack.minMax[0];
            sliceFolder
                .add(stackHelper.slice, vindowWidthGuiLabel, minWindowWidth, maxWindowWidth)
                .step(1)
                .listen();
        }


        createWindowCenterSlider();

        function createWindowCenterSlider() {
            const windowCenterGuiLabel = 'windowCenter';
            const windowCenterMinValue = stack.minMax[0];
            const windowCenterMaxValue = stack.minMax[1];

            sliceFolder
                .add(stackHelper.slice, windowCenterGuiLabel, windowCenterMinValue, windowCenterMaxValue)
                .step(1)
                .listen();
        }

        addColorImageEventListeners();

        function addColorImageEventListeners() {
            sliceFolder.add(stackHelper.slice, 'intensityAuto').listen();
            sliceFolder.add(stackHelper.slice, 'invert');
        }

        sliceFolder.open();
    }

    createBorderBoxPanel();

    function createBorderBoxPanel() {
        const boundingBoxGuiLabel = 'Bounding Box';
        var bboxFolder = gui.addFolder(boundingBoxGuiLabel);

        createVisibleCheckBox();

        function createVisibleCheckBox() {
            const visibleGuiLabel = 'visible';
            bboxFolder.add(stackHelper.bbox, visibleGuiLabel);
        }

        createBorderBoxColorPicker();

        function createBorderBoxColorPicker() {
            const colorGuiLabel = 'color';
            bboxFolder.addColor(stackHelper.bbox, colorGuiLabel);
        }

        bboxFolder.open();
    }

    // border
    var borderFolder = gui.addFolder('Border');
    borderFolder.add(stackHelper.border, 'visible');
    borderFolder.addColor(stackHelper.border, 'color');
    borderFolder.open();
}

/**
 * Start animation loop
 */
function animate() {
    controls.update();
    renderer.render(scene, camera);

    // request new frame
    requestAnimationFrame(function () {
        animate();
    });
}

animate();

// Setup loader
var loader = new AMI.VolumeLoader(container);

var t2 = [
    '36444280',
    '36444294',
    '36444308',
    '36444322',
    '36444336',
    '36444350',
    '36444364',
    '36444378',
    '36444392',
    '36444406',
    '36444434',
    '36444448',
    '36444462',
    '36444476',
    '36444490',
    '36444504',
    '36444518',
    '36444532',
    '36746856'
];
var files = t2.map(function (v) {
    return 'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/' + v;
});

loader
    .load(files)
    .then(function () {
        // merge files into clean series/stack/frame structure
        var series = loader.data[0].mergeSeries(loader.data);
        var stack = series[0].stack[0];
        loader.free();
        loader = null;
        // be carefull that series and target stack exist!
        var stackHelper = new AMI.StackHelper(stack);
        stackHelper.bbox.color = 0x8bc34a;
        stackHelper.border.color = 0xf44336;

        scene.add(stackHelper);

        // build the gui
        gui(stackHelper);

        // center camera and interactor to center of bouding box
        var centerLPS = stackHelper.stack.worldCenter();
        camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
        camera.updateProjectionMatrix();
        controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);
    })
    .catch(function (error) {
        window.console.log('oops... something went wrong...');
        window.console.log(error);
    });

function setupRenderer() {
    var container = document.getElementById('container');
    const smootBorders = true;
    var renderer = new THREE.WebGLRenderer({
        antialias: smootBorders
    });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    const greyBackgroundColor = 0x353535;
    const alpha = 1;
    renderer.setClearColor(greyBackgroundColor, alpha);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    return {container, renderer};
}

function setupScene() {
    return new THREE.Scene();
}

function setupCamera() {
    const fov = 45;
    const aspect = container.offsetWidth / container.offsetHeight;
    const near = 0.01;
    const far = 10000000;

    var camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    camera.position.x = 150;
    camera.position.y = 150;
    camera.position.z = 100;

    return camera;
}

function setupControlls() {
    return new AMI.TrackballControl(camera, container);
}