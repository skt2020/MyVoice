let state={
    socketId: null,
    localStream: null,
    remoteStream: null,
    screenSharingStream: null,
    allowConnectionsFromStrangers: false,
    screenSharingActive: false,
};

export const setSocketId=(socketId)=>{
    state={
        ...state,
        socketId,
    };

    console.log(state);
};

export const setLocalStream=(stream)=>{
    state={
        ...state,
        localStream:stream,
    };
};

export const setAllowConnectionsFromStrangers=(allowConnection)=>{
    state={
        ...state,
        allowConnectionsFromStrangers:allowConnection,
    };
};

export const setscreenSharingActive=(screenSharingActive)=>{
    state={
        ...state,
        screenSharingActive,
    };
};

export const setscreenSharingStream=(stream)=>{
    state={
        ...state,
        screenSharingStream:stream,
    };
};

export const setRemoteStream=(stream)=>{
    state={
        ...state,
        remoteStream:stream,
    };
};

export const getState=()=>{
    return state;
};