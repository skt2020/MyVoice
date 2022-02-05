import * as wss from "./wss.js";
import * as constants from "./constants.js";
import * as ui from "./ui.js";
import * as store from "./store.js";


let connectedUserDetails;
let  peerConnection;

const defaultConstraints={
    audio:true,
    video:true
}

const configuration={
    iceServers: [
        {
            urls:'stun:stun.1.google.com:13902'
        }
    ]
}

export const getLocalPreview=()=>{
    navigator.mediaDevices.getUserMedia(defaultConstraints)
    .then((stream)=>{
        ui.updateLocalVideo(stream);
        store.setLocalStream(stream);
    }).catch((err)=>{
        console.log("error occured when trying to get an access to camera");
        console.log(err);
    })
}


const createPeerConnection=()=>{
    peerConnection=new RTCPeerConnection(configuration);

    peerConnection.onicecandidate=(event)=>{
        console.log("getting ice candidates from sturn server");
        if(event.candidate){
            // send our ice candidate to other peer
            wss.sendDataUsingWebRTCSiginaling({
                connectedUserSocketId:connectedUserDetails.socketId,
                type:constants.webRTCSignaling.ICE_CANDIDATE,
                candidate:event.candidate,
            })
        }
    };

    peerConnection.onconnectionstatechange=(event)=>{
        if(peerConnection.connectionState==='connected')
        {
            console.log("successfully connected with other peer");
        }
    }

    //receiving tracks
    const remoteStream=new MediaStream();
    store.setRemoteStream(remoteStream);
    ui.updateRemoteVideo(remoteStream);

    peerConnection.ontrack=(event)=>{
        remoteStream.addTrack(event.track);
    }
    // add our  stream to peer connection
    if(connectedUserDetails.callType===constants.callType.VIDEO_PERSONAL_CODE){
        const localStream=store.getState().localStream;

        for(const track of localStream.getTracks()){
            peerConnection.addTrack(track,localStream);
        }
    }


};



export const sendPreOffer = (callType,calleePersonalCode)=>{
//console.log("pre offer executed ");
//console.log(callType);
//console.log(calleePersonalCode);
connectedUserDetails={
    callType,
    socketId:calleePersonalCode
};
if(callType===constants.callType.CHAT_PERSONAL_CODE|| callType===constants.callType.VIDEO_PERSONAL_CODE){

    const data={
        callType,
        calleePersonalCode
    };
    ui.showCallinglDialog(callingDialogueRejectCallHandler);
    wss.sendPreOffer(data);

}
};

export const handlePreOffer =(data)=>{
   const {callType,callerSocketId}=data;

   connectedUserDetails={
       socketId:callerSocketId,
       callType,
   };
   if(callType===constants.callType.CHAT_PERSONAL_CODE||callType===constants.callType.VIDEO_PERSONAL_CODE){
       ui.showIncomingCallDialog(callType,acceptCallHandler,rejectCallHandler);
   }
};
const acceptCallHandler=()=>{
    console.log("call accepted");
    createPeerConnection();
    sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED);
    ui.showCallElements(connectedUserDetails.callType);
   }
const rejectCallHandler=()=>{
    console.log("call rejected");
    sendPreOfferAnswer(constants.preOfferAnswer.CALL_REJECTED);
   }

const callingDialogueRejectCallHandler=()=>{
    console.log("rejecting the call");
}

const sendPreOfferAnswer=(preOfferAnswer)=>{
    const data={
        callerSocketId:connectedUserDetails.socketId,
        preOfferAnswer
    }
    ui.removeAllDialogs();
    wss.sendPreOfferAnswer(data);
};

export const handlePreOfferAnswer=(data)=>{
    const {preOfferAnswer}=data;
    console.log('pre offer answer came');
    console.log(data);

    ui.removeAllDialogs();
    if(preOfferAnswer===constants.preOfferAnswer.CALLEE_NOT_FOUND){
        //SHOW DIALOG CALLEE NOT FOUND
        ui.showInfoDialog(preOfferAnswer);
    }
    if(preOfferAnswer===constants.preOfferAnswer.CALL_UNAVAILABLE){
        //SHOW DIALOG CALL_UNAVAILABLE
        ui.showInfoDialog(preOfferAnswer);
    }
    if(preOfferAnswer===constants.preOfferAnswer.CALL_REJECTED){
        //SHOW DIALOG CALL_REJECTED
        ui.showInfoDialog(preOfferAnswer);
    }
    if(preOfferAnswer===constants.preOfferAnswer.CALL_ACCEPTED){
        //SEND WEBRTC OFFER
        ui.showCallElements(connectedUserDetails.callType);
        createPeerConnection();
        sendWebRTCOffer();
    }

};

const sendWebRTCOffer = async ()=>{
    const offer=await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    wss.sendDataUsingWebRTCSiginaling({
        connectedUserSocketId: connectedUserDetails.socketId,
        type: constants.webRTCSignaling.OFFER,
        offer:offer,
    });
};

export const handleWebRTCOffer= async(data)=>{
  await peerConnection.setRemoteDescription(data.offer);
  const answer=await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  wss.sendDataUsingWebRTCSiginaling({
      connectedUserSocketId:connectedUserDetails.socketId,
      type:constants.webRTCSignaling.ANSWER,
      answer:answer,
  });

};

export const handleWebRTCAnswer=async(data)=>{
    console.log('handling webRTC Answer');
    await peerConnection.setRemoteDescription(data.answer);
};


export const handleWebRTCCandidate =async(data)=>{
    console.log("handeling incoming web RTC Candidate");
    try{
        await peerConnection.addIceCandidate(data.candidate);

    }catch(err){
        console.log("error occured when trying to receive ice candidate",err);
    }
};