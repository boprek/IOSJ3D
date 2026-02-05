function DecodeResponse(base64) {
	var binary_string =  window.atob(base64);
	var len = binary_string.length;
	var bytes = new Uint8Array(len);
	for (var i = 0; i < len; i++) {
		bytes[i] = binary_string.charCodeAt(i);
	}
	return new TextDecoder("utf-16").decode(new Uint16Array(pako.inflate(bytes.buffer)));
}

function FillParams(text){
	let params = {};
	let lines = text.replace(/ /g, "").trim().split('\n');
	let token = [];
	for(let i=0;i<lines.length;i++){
		if(lines[i].includes('=') && !lines[i].includes(';')){
			token = lines[i].split('=');
			params[token[0]] = token[1];
		}
	}
	return params;
}

function SetTranslate(text){
	let MSG = {};
	let lines = text.split('\n');
	
	for(var i=0;i<lines.length;i++){
		if(lines[i]=='[HTML]') {break;};
		if(lines[i].includes('"')) {
			token = lines[i].substring(lines[i].indexOf('"')+1,lines[i].indexOf('"',lines[i].indexOf('"')+1));
			MSG[i+1] = token;
		};
	}
	
	let key;
	let pos1,pos2;
	for(;i<lines.length;i++){
		if(lines[i].includes('"')) {
			pos1 = lines[i].indexOf('"',0)+1;
			pos2 = lines[i].indexOf('"',pos1);
			key = lines[i].substring(pos1,pos2);
			pos1 = lines[i].indexOf('"',pos2+1)+1;
			pos2 = lines[i].indexOf('"',pos1);
			token = lines[i].substring(pos1,pos2);
			MSG[key] = token;
			document.getElementById(key).innerHTML = token;
		};
	}
	return MSG;
}

function DecodeBase64(str) {return decodeURIComponent(escape(window.atob(str)));}

window.PrintMessage = function (text, color = "#e0e0e0f3", timeout = 2000) {

    const msg = document.createElement("div");

    // Estilo equivalente al #cartel_save original
    msg.style.position = "absolute";
    msg.style.backgroundColor = color;  // se puede sobrescribir desde WebSocket
    msg.style.color = "white";
    msg.style.display = "flex";
    msg.style.textAlign = "center";
    msg.style.justifyContent = "center";
    msg.style.alignItems = "center";
    msg.style.borderRadius = "25px";
    msg.style.border = "3px solid white";
    msg.style.width = "250px";
    msg.style.height = "80px";
    msg.style.top = "27px";
    msg.style.left = "842px";
    msg.style.zIndex = "99999";
    msg.style.fontSize = "18px";
    msg.style.fontWeight = "bold";
    msg.style.boxShadow = "rgb(0 0 0) 0px 0px 20px, rgb(255 255 255) 0px 0px 6px";
    msg.style.opacity = "0";
    msg.style.transition = "opacity 0.3s ease";

    msg.innerHTML = text;

    // Añadir al DOM
    document.body.appendChild(msg);

    // Fade-in
    setTimeout(() => {
        msg.style.opacity = "1";
    }, 10);

    // Fade-out y eliminar
    setTimeout(() => {
        msg.style.opacity = "0";
        setTimeout(() => msg.remove(), 300);
    }, timeout);
}