/****************************************************************/
/*                                                              */
/* Licensed Materials - Property of IBM                         */
/* 5725-F96 IBM MessageSight                                    */
/* (C) Copyright IBM Corp. 2012, 2013 All Rights Reserved.      */
/*                                                              */
/* US Government Users Restricted Rights - Use, duplication or  */
/* disclosure restricted by GSA ADP Schedule Contract with      */
/* IBM Corp.                                                    */
/*                                                              */
/****************************************************************/

//
// requires mqttws31.js
//

function getUrlVars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
		vars[key] = value;
	});
	return vars;
}

var defaultServer = "192.168.2.145";
var defaultPort = 9000;
var defaultSubTopic = "planets/earth";
var defaultPubTopic = "planets/earth";
var defaultPubMessage = "Hello world!";

var server = (getUrlVars()["ip"] == null) ? defaultServer : getUrlVars()["ip"];
var port = parseFloat((getUrlVars()["port"] == null) ? defaultPort : parseFloat(getUrlVars()["port"]));

var subTopics = [];
var moreTopics = true;
var baseUrlVar = "subTopic";	
var urlVar = baseUrlVar;
var count = 1;
var hasSubTopics = false;
while (moreTopics) {
	if (getUrlVars()[urlVar] != null) {
		subTopics.push(decodeURI(getUrlVars()[urlVar]));
		hasSubTopics = true;
		count++;
		urlVar = baseUrlVar + count;
	} else {
		moreTopics = false;
	}
}
if (subTopics.length == 0) {
	subTopics.push(defaultSubTopic);
}
console.log("subTopics: ", subTopics);

var pubTopic = (getUrlVars()["pubTopic"] == null) ? defaultPubTopic : decodeURI(getUrlVars()["pubTopic"]);
var pubMessage = (getUrlVars()["pubMessage"] == null) ? defaultPubMessage : decodeURI(getUrlVars()["pubMessage"]);
var autoConnect = (getUrlVars()["autoConnect"] == null) ? false : getUrlVars()["autoConnect"];
var autoSubscribe = (getUrlVars()["autoSubscribe"] == null) ? false : getUrlVars()["autoSubscribe"];
var autoPublish = (getUrlVars()["autoPublish"] == null) ? false : getUrlVars()["autoPublish"];
var un = (getUrlVars()["username"] == null) ? false : getUrlVars()["username"];
var pw = (getUrlVars()["password"] == null) ? false : getUrlVars()["password"];
var follow = (getUrlVars()["follow"] == null) ? false : getUrlVars()["follow"];
if (follow) { $("#stickyLog").prop("checked", true); }
var auto = (getUrlVars()["auto"] == null) ? false : getUrlVars()["auto"];
if (auto) { autoConnect = true; autoSubscribe = true; }
autoConnect = true;

$("#connectServer").val(server);
$("#connectPort").val(port);
if (un) { $("#connectUsername").val(un); }
if (pw) { $("#connectPassword").val(pw); }
$("#subscribeTopic").val(subTopics[0]);
$("#publishTopic").val(pubTopic);
$("#publishMessage").val(pubMessage);

if (autoConnect) {
	setTimeout(function() {
		$("#connectButton").click();
	}, 500);
}

var client = null;
$("#connectClientID").val("Client" + Math.floor(10000 + Math.random() * 90000));

$("#connectButton").click(function(event) {
	var server = "192.168.2.145";
	var port = 9000;
	var clientId = "Client" + Math.floor(10000 + Math.random() * 90000);
	var username = "xutao";
	var password = "xutao123";
	var noCleanSession = true;
	var useSSL = false;
	connect(server, port, clientId, username, password, noCleanSession, useSSL);
});
$("#disconnectButton").click(function(event) {
	client.disconnect();
});

$("#publishButton").click(function(event) {
	var topic = $("#publishTopic").val();
	var message = $("#publishMessage").val();
	var qos = parseFloat($("#publishQOS").val());
	retained = $("#publishRetainedOn").hasClass("active");
	publish(topic, message, qos, retained);
});

var subsList = {};
$("#subscribeButton").click(function(event) {
	var topic = $("#subscribeTopic").val();
	var qos = parseFloat($("#subscribeQOS").val());
	client.subscribe(topic, {
		qos: qos,
		onSuccess: function() {
			appendLog("Subscribed to [" + topic + "][qos " + qos + "]");
			if (!subsList[topic]) {
				subsList[topic] = true;
				$("#subscribeList").append("<span style='line-height: 20px; margin:5px 5px 5px 0;' id='"+topic+"' class='label label-info'>"+topic+"&nbsp;<button class='close' onclick='unsubscribe(\""+topic+"\");'>&times;</span></span>");
			}
		},
		onFailure: function() {
			appendLog("Subscription failed: [" + topic + "][qos " + qos + "]");
		}
	});
});

$(".requiresConnect").attr("disabled", true);

function unsubscribe(topic) {
	client.unsubscribe(topic, {
		onSuccess: function() {
			subsList[topic] = null;
			var elem = document.getElementById(topic);
			elem.parentNode.removeChild(elem);
			appendLog("Unsubscribed from [" + topic + "]");
		},
		onFailure: function() {
			appendLog("Unsubscribe failed: [" + topic + "]");
		}
	});
}

function publish(topic, message, qos, retained) {
	var msgObj = new Messaging.Message(message);
	msgObj.destinationName = topic;
	if (qos) { msgObj.qos = qos; }
	if (retained) { msgObj.retained = retained; }
	client.send(msgObj);

	var qosStr = ((qos > 0) ? "[qos " + qos + "]" : "");
	var retainedStr = ((retained) ? "[retained]" : "");
	appendLog("<< [" + topic + "]" + qosStr + retainedStr + " " + message);
}

function connect(server, port, clientId, username, password, noCleanSession, useSSL) {
	try {
		client = new Messaging.Client(server, parseFloat(port), clientId);
	} catch (error) {
		alert("Error:"+error);
	}

	client.onMessageArrived = onMessage;
	client.onConnectionLost = function() { 
		$("#connectedAlert").fadeOut();
		$(".requiresConnect").attr("disabled",true);
		$(".requiresDisconnect").attr("disabled",false);
		appendLog("Disconnected from " + server + ":" + port);
		subsList = {};
		$("#subscribeList").html("");
	}

	var connectOptions = new Object();
	connectOptions.useSSL = false;
	connectOptions.cleanSession = true;
	if (username) {
		connectOptions.userName = username;
	}
	if (password) {
		connectOptions.password = password;
	}
	if (noCleanSession) {
		connectOptions.cleanSession = false;
	}
	if (useSSL) {
		connectOptions.useSSL = true;
	}

	connectOptions.keepAliveInterval = 3600;  // if no activity after one hour, disconnect
	connectOptions.onSuccess = function() { 
		$("#connectedAlert").html("Connected!");
		$("#connectedAlert").fadeIn();
		$("#errorAlert").fadeOut();
		//$("#connectToggle").click();
		//$("#subscribeToggle").click();
		$(".requiresConnect").attr("disabled",false);
		$(".requiresDisconnect").attr("disabled",true);
		appendLog("Connected to " + server + ":" + port);

		if (autoSubscribe) {
			var time = 500;
			for (var i in subTopics) {
				setTimeout((function(topic) {
					return function() {
						$("#subscribeTopic").val(topic);
						$("#subscribeButton").click();
					}
				})(subTopics[i]), time);
				time += 100;
			}
		}
		if (autoPublish) {
			setTimeout(function() {
				$("#publishButton").click();
			}, 500);
		}
	}
	connectOptions.onFailure = function() { 
		$("#errorAlertText").html("Failed to connect!");
		$("#connectedAlert").fadeOut();
		$("#errorAlert").fadeIn();
		setTimeout(function() { $("#errorAlert").fadeOut(); }, 2000);
		$(".requiresConnect").attr("disabled",true);
		$(".requiresDisconnect").attr("disabled",false);
		appendLog("Failed to connect to " + server + ":" + port);
	}

	client.connect(connectOptions);
}

// function called whenever our MQTT connection receives a message
function onMessage(msg) {
	var topic = msg.destinationName;
	var payload = msg.payloadString;
	var qos = msg._getQos();
	var retained = msg._getRetained();

	var qosStr = ((qos > 0) ? "[qos " + qos + "]" : "");
	var retainedStr = ((retained) ? "[retained]" : "");
	appendLog(">> [" + topic + "]" + qosStr + retainedStr + " " + payload);
}

var logEntries = 0;
function appendLog(msg) {
	logEntries++;
	msg = "(" + ((new Date()).toISOString().split("T"))[1].substr(0, 12) + ") " + msg;
	$("#logContents").append(msg + "\n");
	$("#logSize").html(logEntries);
	if ($("#stickyLog").prop("checked")) {
		$("#logContents").prop("scrollTop", $("#logContents").prop("scrollHeight") - $("#logContents").height());
	}
}

function clearLog() {
	logEntries = 0;
	$("#logContents").html("");
	$("#logSize").html("0");
}
