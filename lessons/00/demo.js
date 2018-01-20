/* globals AMI*/


const container = getElementToContainProgressBar();

function getElementToContainProgressBar() {
    return document.getElementById('container');
}


let loader = getLoader();

function getLoader() {
    return new AMI.VolumeLoader(container);
}

const t2 = setDataURLTermination();

function setDataURLTermination() {
    return [
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
}

const files = getFiles();

function getFiles() {
    return t2.map(function (currentTermination) {
        return 'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/' + currentTermination;
    });
}


loader
    .load(files)
    .then(function () {

        const series = loader.data[0].mergeSeries(loader.data);
        loader.free();
        loader = null;

        displaySeriesInfo(series);
    })
    .catch(function (error) {
        window.console.log('oops... something went wrong...');
        window.console.log(error);
    });

function displaySeriesInfo(series) {
    let seriesIndex = 1;
    for (let mySeries of series) {
        let seriesDiv = document.createElement('div');
        seriesDiv.className += 'indent';
        seriesDiv.insertAdjacentHTML('beforeend', '<div> SERIES (' + seriesIndex + '/' + series.length + ')</div>');
        seriesDiv.insertAdjacentHTML(
            'beforeend',
            '<div class="series"> numberOfChannels: ' + mySeries.numberOfChannels + '</div>'
        );

        container.appendChild(seriesDiv);

        displayStackInfo(mySeries, seriesDiv);

        seriesIndex++;
    }
}


function displayStackInfo(mySeries, seriesDiv) {
    let stackIndex = 1;
    for (let myStack of mySeries.stack) {
        let stackDiv = document.createElement('div');
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

        displayFrameInfo(myStack, stackDiv);

        stackIndex++;
    }
    return {stackIndex, stackDiv};
}

function displayFrameInfo(myStack, stackDiv) {
    let frameIndex = 1;
    for (let myFrame of myStack.frame) {
        let frameDiv = document.createElement('div');
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
    return {frameIndex};
}
