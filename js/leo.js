var manager;
var ros;
var batterySub;
var robot_hostname;
var batterySub;
var joint1Pub;
var joint2Pub;
var joint1Val, joint2Val;
var joint1Last=0, joint2Last=0;
var jointIntervalID;
var LowerClient;
var LiftClient;


function initROS() {

    ros = new ROSLIB.Ros({
        // url: "ws://" + robot_hostname + ":9090"
        url: "ws://192.168.4.163:9090"
    
    });


    joint1Pub = new ROSLIB.Topic({
        ros: ros,
        name: '/mast_3_joint/command',
        messageType: 'std_msgs/Float64',
        latch: true,
        queue_size: 5
    });

    joint1Pub.advertise();

    joint2Pub = new ROSLIB.Topic({
        ros: ros,
        name: '/mast_2_joint/command',
        messageType: 'std_msgs/Float64',
        latch: true,
        queue_size: 5
    });

    joint2Pub.advertise();

    LiftClient = new ROSLIB.Service({
        ros : ros,
        name : '/mast/lift',
        serviceType : 'std_srvs/Trigger'
      });

    LowerClient = new ROSLIB.Service({
        ros : ros,
        name : '/mast/lower',
        serviceType : 'std_srvs/Trigger'
      });
    


    systemRebootPub = new ROSLIB.Topic({
        ros: ros,
        name: '/system/reboot',
        messageType: 'std_msgs/Empty'
    });
    systemRebootPub.advertise();

    systemShutdownPub = new ROSLIB.Topic({
        ros: ros,
        name: '/system/shutdown',
        messageType: 'std_msgs/Empty'
    });
    systemShutdownPub.advertise();

    batterySub = new ROSLIB.Topic({
        ros : ros,
        name : '/battery',
        messageType : 'std_msgs/Float32',
        queue_length: 1
    });
    batterySub.subscribe(batteryCallback);

}

function initSliders() {

    $('#s1-slider').slider({
        tooltip: 'show',
        min: -Math.PI/2,
        max: Math.PI/2,
        step: 0.01,
        value: 0
    });
    $('#s1-slider').on("slide", function(slideEvt) {
        joint1Val = slideEvt.value;
    });

    $('#s2-slider').slider({
        tooltip: 'show',
        min: -Math.PI,
        max: Math.PI,
        step: 0.01,
        value: 0
    });
    $('#s2-slider').on("slide", function(slideEvt) {
        joint2Val = slideEvt.value;
    });

}

function publishJoints() {
    var jointMsg;

    if (joint1Val != joint1Last) {
        joint1Last = joint1Val;
        jointMsg = new ROSLIB.Message({
            data: joint1Val
        });
        joint1Pub.publish(jointMsg);
    }

    if (joint2Val != joint2Last) {
        joint2Last = joint2Val;
        jointMsg = new ROSLIB.Message({
            data: joint2Val
        });
        joint2Pub.publish(jointMsg);
    }

}

function batteryCallback(message) {
    document.getElementById('batteryID').innerHTML = 'Voltage: ' + message.data.toPrecision(4) + 'V';
}

function systemReboot(){
    systemRebootPub.publish()
}

function turnOff(){
    systemShutdownPub.publish()
}




function Trig(){

    var checkBox = document.getElementById("button");

    

    if (checkBox.checked == true){
        document.getElementById("onoff").innerHTML = "Lower";
        checkBox.disabled=true;
        LiftClient.callService(new ROSLIB.ServiceRequest(), function(result)
        {
            checkBox.disabled=false;
            console.log(result.message);
        });


        
    }
    else {
        document.getElementById("onoff").innerHTML = "Lift";
        checkBox.disabled=true;
        LowerClient.callService(new ROSLIB.ServiceRequest(), function(result)
        {
            checkBox.disabled=false;
            console.log(result.message);
        });


    }


}


function shutdown() {

    clearInterval(jointIntervalID);
    
    systemRebootPub.unadvertise();
    systemShutdownPub.unadvertise();
    batterySub.unsubscribe();
    ros.close();
}

window.onload = function () {

    robot_hostname = location.hostname;

    initROS();
    initSliders();

    jointIntervalID = setInterval(() => publishJoints(), 100); // 10 hz

    window.addEventListener("beforeunload", () => shutdown());
}


