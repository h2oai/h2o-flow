var sla_times = {
	CRITICAL: {
		"Unassigned": moment.duration(10, 'm'),
		"Assigned": moment.duration(30, 'm'),
		"In-Progress": moment.duration(8, 'h'),
		"Closed": moment.duration(8, 'h')
	},
	HIGH:{
		"Unassigned": moment.duration(20, 'm'),
		"Assigned": moment.duration(45, 'm'),
		"In-Progress": moment.duration(12, 'h'),
		"Closed": moment.duration(12, 'h')
	},
	MEDIUM:{
		"Unassigned": moment.duration(1, 'h'),
		"Assigned": moment.duration(1, 'h'),
		"In-Progress": moment.duration(24, 'h'),
		"Closed": moment.duration(24, 'h')
	},
	LOW:{
		"Unassigned": moment.duration(2, 'h'),
		"Assigned": moment.duration(2, 'h'),
		"In-Progress": moment.duration(36, 'h'),
		"Closed": moment.duration(36, 'h')
	},
	INFO:{
		"Unassigned": moment.duration(4, 'h'),
		"Assigned": moment.duration(4, 'h'),
		"In-Progress": moment.duration(48, 'h'),
		"Closed": moment.duration(48, 'h')
	}
}

var START_TICKETS = 120,
	PRIORITY = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"],
	OWNER = ["HSN235", "JAS891", "JJR147", "SDF987", "JHQ406"],
	STATUS = ["Unassigned", "Assigned", "In-Progress", "Closed"],
	SOURCE = ["Ironport", "Aruba", "Checkpoint", "Bluecoat"],
	START_STATUS = STATUS[0],
	MAX_NEW_EVENTS_PER_GEN = 8,
	MAX_NEW_TICKETS_PER_GEN = 5;

var generatedData = [];

var randNum = function(num){
	return Math.floor(Math.random() * num );
}

var randArraySelector = function(arr){
	return arr[Math.floor(Math.random() * arr.length)]
}

var randTimeBeforeNow = function(){

	var rand_h = Math.floor(Math.random() * (moment().get('h')+1) )

	var rand_m;

	if ( rand_h < moment().get('h') ){
		rand_m = Math.floor(Math.random() * 60)
	} else {
		rand_m = Math.floor(Math.random() * moment().get('m'))
	}

	return moment(rand_h + ":" + rand_m, "h:m");
}

function fake_data_start(){

	for (var i=0; i < START_TICKETS; i++){
		var rand_d = {
			eventid: i,
			priority: randArraySelector(PRIORITY),
			owner: randArraySelector(OWNER),
			status: randArraySelector(STATUS),
			alert_source: randArraySelector(SOURCE),
			timestamp: randTimeBeforeNow()
		}

		generatedData.push(rand_d);
	}
}


function data_gen() {

	for (var tix_i = 0; tix_i <= randNum(MAX_NEW_TICKETS_PER_GEN); tix_i ++){

		var new_d = {
			eventid: generatedData.length,
			priority: randArraySelector(PRIORITY),
			owner: randArraySelector(OWNER),
			status: START_STATUS,
			alert_source: randArraySelector(SOURCE),
			timestamp: moment()
		}

		generatedData.push(new_d);

		// console.log("new event");
		// console.log(new_d);
	}

	for (var evt_i = 0; evt_i <= randNum(MAX_NEW_EVENTS_PER_GEN); evt_i ++){

		var old_data_i, status_i;

		var found_good_evt = false;

		while (!found_good_evt){

			old_data_i = randNum(generatedData.length-1);
			
			if ( STATUS.indexOf( generatedData[old_data_i]["status"] ) < STATUS.length - 1){
				
				// move to the next stage of status
				status_i = STATUS[ STATUS.indexOf( generatedData[old_data_i]["status"] ) + 1 ];
				found_good_evt = true;
			}

		}

		generatedData[old_data_i].status = status_i;
		generatedData[old_data_i].timestamp = moment();

		// console.log("updated");
		// console.log(generatedData[old_data_i]);

	}

	console.log( "generated " + tix_i + " new tickets, and updated " + evt_i);

}

fake_data_start();