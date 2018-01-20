/* globals dat*/
import CoreUtils from 'base/core/core.utils';
import LoadersVolume from 'base/loaders/loaders.volume';
import HelpersStack from 'base/helpers/helpers.stack';
import HelpersLut from 'base/helpers/helpers.lut';
import CamerasOrthographic from 'base/cameras/cameras.orthographic';
import ControlsOrthographic from 'base/controls/controls.trackballortho';

// standard global variables
let controls;
let renderer;
let scene;
let camera;
let threeD;
let lut;

let ctrlDown = false;
let drag = {
    start: {
        x: null,
        y: null,
    },
};

// probe
let camUtils = {
    invertRows: false,
    invertColumns: false,
    rotate: false,
    orientation: 'default',
    convention: 'radio',
};

/**
 * Init the scene
 */
function init() {
    /**
     * Animation loop
     */
    function animate() {
        // render
        controls.update();
        renderer.render(scene, camera);

        // request new frame
        requestAnimationFrame(function () {
            animate();
        });
    }

    setRenderer();

    function setRenderer() {
        threeD = document.getElementById('r3d');
        const smoothBorders = true;
        renderer = new THREE.WebGLRenderer({
            antialias: smoothBorders,
        });
        renderer.setSize(threeD.clientWidth, threeD.clientHeight);
        const gray = 0x212121;
        const opacity = 1;
        renderer.setClearColor(gray, opacity);

        threeD.appendChild(renderer.domElement);
    }


    scene = new THREE.Scene();

    setCamera();

    function setCamera() {
        const left = threeD.clientWidth / -2;
        const right = threeD.clientWidth / 2;
        const top = threeD.clientHeight / 2;
        const bottom = threeD.clientHeight / -2;
        const near = 0.1;
        const far = 10000;
        camera = new CamerasOrthographic(
            left, right,
            top, bottom,
            near, far);
    }


    setControls();

    function setControls() {
        const object = camera;
        const domElement = threeD;
        controls = new ControlsOrthographic(object, domElement);
        controls.staticMoving = true;
        controls.noRotate = true;
        camera.controls = controls;
    }

    animate();
}

window.onload = function () {
    setFileInputOnButtonClick();

    function setFileInputOnButtonClick() {
        document.getElementById('buttoninput').onclick = function () {
            document.getElementById('filesinput').click();
        };
    }

    // init threeJS...
    init();

    function updateLabels(labels, modality) {
        if (modality === 'CR' || modality === 'DX') return;

        let top = document.getElementById('top');
        top.innerHTML = labels[0];

        let bottom = document.getElementById('bottom');
        bottom.innerHTML = labels[1];

        let right = document.getElementById('right');
        right.innerHTML = labels[2];

        let left = document.getElementById('left');
        left.innerHTML = labels[3];
    }

    function buildGUI(stackHelper) {
        let {stack, gui} = createGui();

        function createGui() {
            let stack = stackHelper._stack;

            let gui = new dat.GUI({
                autoPlace: false,
            });

            let customContainer = document.getElementById('my-gui-container');
            customContainer.appendChild(gui.domElement);
            return {stack, gui};
        }


        let stackFolder = createStackFolderOnGui();

        function createStackFolderOnGui() {
            let stackFolder = gui.addFolder('Stack');
            return stackFolder;
        }


        setWindowWidth();

        function setWindowWidth() {
            const minWidth = 1;
            const maxWidth = stack.minMax[1] - stack.minMax[0];
            stackFolder.add(
                stackHelper.slice, 'windowWidth', minWidth, maxWidth)
                .step(1).listen();
        }

        setWindowCenter();

        function setWindowCenter() {
            const minCenter = stack.minMax[0];
            const maxCenter = stack.minMax[1];
            stackFolder.add(
                stackHelper.slice, 'windowCenter', minCenter, maxCenter)
                .step(1).listen();
        }

        setIntensity();

        function setIntensity() {
            stackFolder.add(stackHelper.slice, 'intensityAuto').listen();
        }

        setInvert();

        function setInvert() {
            stackFolder.add(stackHelper.slice, 'invert');
        }


        setInterpolation();

        function setInterpolation() {
            const minInterpolation = 0;
            const maxInterpolation = 1;
            stackFolder.add(stackHelper.slice, 'interpolation', minInterpolation, maxInterpolation).step(1).listen();
        }


        // CREATE LUT

        setLUT();

        function setLUT() {
            createLUT();

            function createLUT() {
                const domTarget = 'my-lut-canvases';
                const lookUpTable = 'default';
                const modeToApplyGradientInLut = 'linear_full';
                const color = [[0, 0, 0, 0], [1, 1, 1, 1]];
                const opacity = [[0, 1], [1, 1]];
                lut = new HelpersLut(
                    domTarget,
                    lookUpTable,
                    modeToApplyGradientInLut,
                    color,
                    opacity);
                lut.luts = HelpersLut.presetLuts();
            }


            updateLUT();

            function updateLUT() {
                let lutUpdate = stackFolder.add(
                    stackHelper.slice, 'lut', lut.lutsAvailable());
                lutUpdate.onChange(function (value) {
                    lut.lut = value;
                    stackHelper.slice.lutTexture = lut.texture;
                });
            }

            discreteLUT();

            function discreteLUT() {
                let lutDiscrete = stackFolder.add(lut, 'discrete', false);
                lutDiscrete.onChange(function (value) {
                    lut.discrete = value;
                    stackHelper.slice.lutTexture = lut.texture;
                });
            }

        }

        let index = setIndex();

        function setIndex() {
            const minIndex = 0;
            const maxIndex = stack.dimensionsIJK.z - 1;
            let index = stackFolder.add(
                stackHelper, 'index', minIndex, maxIndex).step(1).listen();
            return index;
        }

        stackFolder.open();

        createCameraFolderOnGui();

        function createCameraFolderOnGui() {
            let cameraFolder = gui.addFolder('Camera');

            setInvertRows();

            function setInvertRows() {
                let invertRows = cameraFolder.add(camUtils, 'invertRows');
                invertRows.onChange(function () {
                    camera.invertRows();
                    updateLabels(camera.directionsLabel, stack.modality);
                });
            }


            function setInvertColumns() {
                let invertColumns = cameraFolder.add(camUtils, 'invertColumns');
                invertColumns.onChange(function () {
                    camera.invertColumns();
                    updateLabels(camera.directionsLabel, stack.modality);
                });
            }

            setInvertColumns();

            let angle = cameraFolder.add(camera, 'angle', 0, 360).step(1).listen();
            angle.onChange(function () {
                updateLabels(camera.directionsLabel, stack.modality);
            });

            setRotation();

            function setRotation() {
                let rotate = cameraFolder.add(camUtils, 'rotate');
                rotate.onChange(function () {
                    camera.rotate();
                    updateLabels(camera.directionsLabel, stack.modality);
                });
            }


            setOrientation();

            function setOrientation() {
                let orientationUpdate = cameraFolder.add(
                    camUtils, 'orientation', ['default', 'axial', 'coronal', 'sagittal']);

                updateOrientation();

                function updateOrientation() {
                    orientationUpdate.onChange(function (value) {
                        camera.orientation = value;
                        camera.update();

                        const numberOfDirectionsToRecalculateCameraZoom = 2;
                        camera.fitBox(numberOfDirectionsToRecalculateCameraZoom);
                        stackHelper.orientation = camera.stackOrientation;
                        updateLabels(camera.directionsLabel, stack.modality);

                        index.__max = stackHelper.orientationMaxIndex;
                        stackHelper.index = putRotationAnglesSliderAtMediumPointOnGui();

                        function putRotationAnglesSliderAtMediumPointOnGui() {
                            return Math.floor(index.__max / 2);
                        }
                    });
                }

            }

            setConvention();

            function setConvention() {
                let conventionUpdate = cameraFolder.add(
                    camUtils, 'convention', ['radio', 'neuro']);
                conventionUpdate.onChange(function (value) {
                    camera.convention = value;
                    camera.update();
                    camera.fitBox(2);
                    updateLabels(camera.directionsLabel, stack.modality);
                });
            }

        }
    }

    /**
     * Connect all callbevent observesrs
     */
    function hookCallbacks(stackHelper) {
        let stack = stackHelper._stack;

        setOnScrollControl();

        function setOnScrollControl() {
            controls.addEventListener('OnScroll', function (e) {
                if (e.delta > 0) {
                    if (stackHelper.index >= stackHelper.orientationMaxIndex - 1) {
                        return false;
                    }
                    stackHelper.index += 1;
                } else {
                    if (stackHelper.index <= 0) {
                        return false;
                    }
                    stackHelper.index -= 1;
                }
            });
        }

        /**
         * On window resize callback
         */
        function onWindowResize() {
            let threeD = document.getElementById('r3d');
            camera.canvas = {
                width: threeD.clientWidth,
                height: threeD.clientHeight,
            };
            camera.fitBox(2);

            renderer.setSize(threeD.clientWidth, threeD.clientHeight);

            // update info to draw borders properly
            stackHelper.slice.canvasWidth = threeD.clientWidth;
            stackHelper.slice.canvasHeight = threeD.clientHeight;
        }

        window.addEventListener('resize', onWindowResize, false);
        onWindowResize();

        /**
         * On key pressed callback
         */
        function onWindowKeyPressed(event) {
            ctrlDown = event.ctrlKey;
            if (!ctrlDown) {
                drag.start.x = null;
                drag.start.y = null;
            }
        }

        document.addEventListener('keydown', onWindowKeyPressed, false);
        document.addEventListener('keyup', onWindowKeyPressed, false);

        /**
         * On mouse move callback
         */
        function onMouseMove(event) {
            if (ctrlDown) {
                if (drag.start.x === null) {
                    drag.start.x = event.clientX;
                    drag.start.y = event.clientY;
                }
                let threshold = 15;

                stackHelper.slice.intensityAuto = false;

                let dynamicRange = stack.minMax[1] - stack.minMax[0];
                dynamicRange /= threeD.clientWidth;

                if (Math.abs(event.clientX - drag.start.x) > threshold) {
                    // window width
                    stackHelper.slice.windowWidth +=
                        dynamicRange * (event.clientX - drag.start.x);
                    drag.start.x = event.clientX;
                }

                if (Math.abs(event.clientY - drag.start.y) > threshold) {
                    // window center
                    stackHelper.slice.windowCenter -=
                        dynamicRange * (event.clientY - drag.start.y);
                    drag.start.y = event.clientY;
                }
            }
        }

        document.addEventListener('mousemove', onMouseMove);
    }

    /**
     * Visulaize incoming data
     */
    function handleSeries(seriesContainer) {
        // cleanup the loader and its progress bar
        loader.free();
        loader = null;
        // prepare for slice visualization
        // first stack of first series
        let stack = seriesContainer[0].mergeSeries(seriesContainer)[0].stack[0];

        let stackHelper = new HelpersStack(stack);
        stackHelper.bbox.visible = false;
        stackHelper.borderColor = '#2196F3';
        stackHelper.border.visible = false;
        scene.add(stackHelper);

        console.log(stackHelper.stack);

        setCamera();

        function setCamera() {
            let lpsDims = calculateLPSCoordinates();

            function calculateLPSCoordinates() {
                let worldbb = stack.worldBoundingBox();
                const leftRightDimension = (worldbb[1] - worldbb[0]) / 2;
                const posteriorAnteriorDimension = (worldbb[3] - worldbb[2]) / 2;
                const superiorInferiorDimension = (worldbb[5] - worldbb[4]) / 2;
                let lpsDims = new THREE.Vector3(
                    leftRightDimension,
                    posteriorAnteriorDimension,
                    superiorInferiorDimension
                );
                return lpsDims;
            }


            let box = calculateCameraFieldOfView();

            function calculateCameraFieldOfView() {
                let box = {
                    center: stack.worldCenter().clone(),
                    halfDimensions:
                        new THREE.Vector3(lpsDims.x + 10, lpsDims.y + 10, lpsDims.z + 10),
                };
                return box;
            }

            let canvas = createCanvas();

            function createCanvas() {
                let canvas = {
                    width: threeD.clientWidth,
                    height: threeD.clientHeight,
                };
                return canvas;
            }


            configureCamera();

            function configureCamera() {
                camera.directions = [stack.xCosine, stack.yCosine, stack.zCosine];
                camera.box = box;
                camera.canvas = canvas;
                camera.update();
                camera.fitBox(2);
            }


            updateLabels(camera.directionsLabel, stack.modality);
        }

        buildGUI(stackHelper);
        hookCallbacks(stackHelper);
    }

    let loader = new LoadersVolume(threeD);
    let seriesContainer = [];

    /**
     * Filter array of data by extension
     * extension {String}
     * item {Object}
     * @return {Boolean}
     */
    function _filterByExtension(extension, item) {
        if (item.extension.toUpperCase() === extension.toUpperCase()) {
            return true;
        }
        return false;
    }

    /**
     * Parse incoming files
     */
    function readMultipleFiles(evt) {
        // hide the upload button
        if (evt.target.files.length) {
            document.getElementById('home-container').style.display = 'none';
        }

        /**
         * Load sequence
         */
        function loadSequence(index, files) {
            return Promise.resolve()
            // load the file
                .then(function () {
                    return new Promise(function (resolve, reject) {
                        let myReader = new FileReader();
                        // should handle errors too...
                        myReader.addEventListener('load', function (e) {
                            resolve(e.target.result);
                        });
                        myReader.readAsArrayBuffer(files[index]);
                    });
                })
                .then(function (buffer) {
                    return loader.parse({url: files[index].name, buffer});
                })
                .then(function (series) {
                    seriesContainer.push(series);
                })
                .catch(function (error) {
                    window.console.log('oops... something went wrong...');
                    window.console.log(error);
                });
        }

        /**
         * Load group sequence
         */
        function loadSequenceGroup(files) {
            const fetchSequence = [];

            for (let i = 0; i < files.length; i++) {
                fetchSequence.push(
                    new Promise((resolve, reject) => {
                        const myReader = new FileReader();
                        // should handle errors too...
                        myReader.addEventListener('load', function (e) {
                            resolve(e.target.result);
                        });
                        myReader.readAsArrayBuffer(files[i].file);
                    })
                        .then(function (buffer) {
                            return {url: files[i].file.name, buffer};
                        })
                );
            }

            return Promise.all(fetchSequence)
                .then((rawdata) => {
                    return loader.parse(rawdata);
                })
                .then(function (series) {
                    seriesContainer.push(series);
                })
                .catch(function (error) {
                    window.console.log('oops... something went wrong...');
                    window.console.log(error);
                });
        }

        const loadSequenceContainer = [];

        const data = [];
        const dataGroups = [];
        // convert object into array
        for (let i = 0; i < evt.target.files.length; i++) {
            let dataUrl = CoreUtils.parseUrl(evt.target.files[i].name);
            if (dataUrl.extension.toUpperCase() === 'MHD' ||
                dataUrl.extension.toUpperCase() === 'RAW') {
                dataGroups.push(
                    {
                        file: evt.target.files[i],
                        extension: dataUrl.extension.toUpperCase(),
                    });
            } else {
                data.push(evt.target.files[i]);
            }
        }

        // check if some files must be loaded together
        if (dataGroups.length === 2) {
            // if raw/mhd pair
            const mhdFile = dataGroups.filter(_filterByExtension.bind(null, 'MHD'));
            const rawFile = dataGroups.filter(_filterByExtension.bind(null, 'RAW'));
            if (mhdFile.length === 1 &&
                rawFile.length === 1) {
                loadSequenceContainer.push(
                    loadSequenceGroup(dataGroups)
                );
            }
        }

        // load the rest of the files
        for (let i = 0; i < data.length; i++) {
            loadSequenceContainer.push(
                loadSequence(i, data)
            );
        }

        // run the load sequence
        // load sequence for all files
        Promise
            .all(loadSequenceContainer)
            .then(function () {
                handleSeries(seriesContainer);
            })
            .catch(function (error) {
                window.console.log('oops... something went wrong...');
                window.console.log(error);
            });
    }

    // hook up file input listener
    document.getElementById('filesinput')
        .addEventListener('change', readMultipleFiles, false);
};
