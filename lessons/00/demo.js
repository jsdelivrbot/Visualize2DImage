/* globals AMI*/


var container = getElementToContainProgressBar();

function getElementToContainProgressBar() {
    var container = document.getElementById('container');
    return container;
}


// instantiate the loader
var loader = getLoader();

function getLoader() {
    var loader = new AMI.VolumeLoader(container);
    return loader;
}

var t2 = setDataURLTermination();

function setDataURLTermination() {
    var t2 = ['36444280', '36444294', '36444308', '36444322', '36444336'];
    return t2;
}

var files = getFiles();

function getFiles() {
    var files = t2.map(function (currentTermination) {
        return 'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/' + currentTermination;
    });
    return files;
}


loader
    .load(files)
    .then(function () {

        var series = loader.data[0].mergeSeries(loader.data);
        loader.free();
        loader = null;


        //window.console.log(series);

        displaySeriesInfo(series);
    })
    .catch(function (error) {
        window.console.log('oops... something went wrong...');
        window.console.log(error);
    });

function displaySeriesInfo(series) {
    var seriesIndex = 1;
    for (var mySeries of series) {
        var seriesDiv = document.createElement('div');
        seriesDiv.className += 'indent';
        seriesDiv.insertAdjacentHTML('beforeend', '<div> SERIES (' + seriesIndex + '/' + series.length + ')</div>');
        seriesDiv.insertAdjacentHTML(
            'beforeend',
            '<div class="series"> numberOfChannels: ' + mySeries.numberOfChannels + '</div>'
        );

        container.appendChild(seriesDiv);

        var {stackIndex, stackDiv} = displayStackInfo(mySeries, seriesDiv);

        seriesIndex++;
    }
}


function displayStackInfo(mySeries, seriesDiv) {
    var stackIndex = 1;
    for (var myStack of mySeries.stack) {
        var stackDiv = document.createElement('div');
        stackDiv.className += 'indent';
        stackDiv.insertAdjacentHTML(
            'beforeend',
            '<div> STACK (' + stackIndex + '/' + mySeries.stack.length + ')</div>'
        );
        stackDiv.insertAdjacentHTML(
            'beforeend',
            '<div class="stack"> bitsAllocated: ' + myStack.bitsAllocated + '</div>'
        );

        seriesDiv.appendChild(stackDiv);

        var {frameIndex, frameDiv} = displayFrameInfo(myStack, stackDiv);

        stackIndex++;
    }
    return {stackIndex, stackDiv};
}

function displayFrameInfo(myStack, stackDiv) {
    var frameIndex = 1;
    for (var myFrame of myStack.frame) {
        var frameDiv = document.createElement('div');
        frameDiv.className += 'indent';
        frameDiv.insertAdjacentHTML(
            'beforeend',
            '<div> FRAME (' + frameIndex + '/' + myStack.frame.length + ')</div>'
        );
        frameDiv.insertAdjacentHTML(
            'beforeend',
            '<div class="frame"> instanceNumber: ' + myFrame.instanceNumber + '</div>'
        );

        stackDiv.appendChild(frameDiv);
        frameIndex++;
    }
    return {frameIndex, frameDiv};
}
