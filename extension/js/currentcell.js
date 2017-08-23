import Jupyter from 'base/js/namespace';
import events from 'base/js/events';
import codecell from 'notebook/js/codecell';
import $ from 'jquery'

//Module to detect the currently running cell.
//The notebook sends execution requests, and they queue up on the message channel.
//There is no straight forward way to detect the currently running cell.
//Here we use a queue to store execution requests and dequeue elements as the kernel becomes idle after the requests
//TODO take care of any corner cases.


var CodeCell = codecell.CodeCell;
var current_cell;
var last_cell;
var cell_queue = [];
var registered = false;

function cell_execute_called(event, data) {

    var cell = data.cell
    console.log('SparkMonitor: Cell Execution CALLED: ', data)
    if (cell instanceof CodeCell) {
        if (cell_queue.length <= 0) {
            events.trigger('started.currentcell', cell)
            events.trigger('started' + cell.cell_id + 'currentcell', cell)
        }
        cell_queue.push(cell);
        current_cell = cell_queue[0];
    }
}

//Kernel Idle
function cell_execute_finished() {
    //  console.log('SparkMonitor: Cell execution FINISHED')
    if (current_cell != null) {
        events.trigger('finished.currentcell', current_cell);
        events.trigger('finished' + current_cell.cell_id + 'currentcell', current_cell);
    }
    cell_queue.shift();
    current_cell = cell_queue[0]
    if (current_cell != null) {
        events.trigger('started.currentcell', current_cell)
        events.trigger('started' + current_cell.cell_id + 'currentcell', current_cell);
    }
}

function getRunningCell() {
    return current_cell
}
function getLastCell() {
    return last_cell
}

function cell_deleted(event, data) {
    // console.log("SparkMonitor: DELETING CELL")
    var cell = data.cell;
    var i = cell_queue.indexOf(cell);
    if (i >= -1) { cell_queue.splice(i, 1); }
    // console.log("SparkMonitor: DELETING CELL",i,cell);

}

function register() {
    if (registered) return;
    events.on('execute.CodeCell', cell_execute_called);
    events.on('kernel_idle.Kernel', cell_execute_finished);
    events.on('delete.Cell', cell_deleted)

    //TODO clear queue on execute error

    //For Debugging purposes. Highlights the currently running cell in colour.
    events.on('started.currentcell', function (event, cell) { cell.element.css('background-color', '#EEEEEE') });
    events.on('finished.currentcell', function (event, cell) { cell.element.css('background-color', 'white') });
}
function unregister() {
    //TODO cleanup events
}

export default {
    'register': register,
    'unregister': unregister,
    'getRunningCell': getRunningCell,
    'getLastCell': getLastCell,
}