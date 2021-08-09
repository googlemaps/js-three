!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports,require("three")):"function"==typeof define&&define.amd?define(["exports","three"],e):e(((t="undefined"!=typeof globalThis?globalThis:t||self).google=t.google||{},t.google.maps=t.google.maps||{},t.google.maps.plugins=t.google.maps.plugins||{},t.google.maps.plugins.three={}),t.three)}(this,(function(t,e){"use strict";var r="undefined"!=typeof ArrayBuffer&&"undefined"!=typeof DataView,n=function(t){try{return!!t()}catch(t){return!0}},o=!n((function(){return 7!=Object.defineProperty({},1,{get:function(){return 7}})[1]})),i="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};function a(t,e){return t(e={exports:{}},e.exports),e.exports}var u,c,s=function(t){return t&&t.Math==Math&&t},f=s("object"==typeof globalThis&&globalThis)||s("object"==typeof window&&window)||s("object"==typeof self&&self)||s("object"==typeof i&&i)||function(){return this}()||Function("return this")(),l=function(t){return"object"==typeof t?null!==t:"function"==typeof t},p=function(t){return Object(function(t){if(null==t)throw TypeError("Can't call method on "+t);return t}(t))},y={}.hasOwnProperty,h=Object.hasOwn||function(t,e){return y.call(p(t),e)},d=function(t,e){try{Object.defineProperty(f,t,{value:e,configurable:!0,writable:!0})}catch(r){f[t]=e}return e},g="__core-js_shared__",v=f[g]||d(g,{}),b=a((function(t){(t.exports=function(t,e){return v[t]||(v[t]=void 0!==e?e:{})})("versions",[]).push({version:"3.16.1",mode:"global",copyright:"© 2021 Denis Pushkarev (zloirock.ru)"})})),m=0,w=Math.random(),S=function(t){return"Symbol("+String(void 0===t?"":t)+")_"+(++m+w).toString(36)},O=function(t){return"function"==typeof t?t:void 0},T=function(t,e){return arguments.length<2?O(f[t]):f[t]&&f[t][e]},A=T("navigator","userAgent")||"",j=f.process,M=f.Deno,_=j&&j.versions||M&&M.version,x=_&&_.v8;x?c=(u=x.split("."))[0]<4?1:u[0]+u[1]:A&&(!(u=A.match(/Edge\/(\d+)/))||u[1]>=74)&&(u=A.match(/Chrome\/(\d+)/))&&(c=u[1]);var R=c&&+c,E=!!Object.getOwnPropertySymbols&&!n((function(){var t=Symbol();return!String(t)||!(Object(t)instanceof Symbol)||!Symbol.sham&&R&&R<41})),P=E&&!Symbol.sham&&"symbol"==typeof Symbol.iterator,C=b("wks"),I=f.Symbol,L=P?I:I&&I.withoutSetter||S,D=function(t){return h(C,t)&&(E||"string"==typeof C[t])||(E&&h(I,t)?C[t]=I[t]:C[t]=L("Symbol."+t)),C[t]},U={};U[D("toStringTag")]="z";var F="[object z]"===String(U),z={}.toString,V=function(t){return z.call(t).slice(8,-1)},W=D("toStringTag"),k="Arguments"==V(function(){return arguments}()),q=F?V:function(t){var e,r,n;return void 0===t?"Undefined":null===t?"Null":"string"==typeof(r=function(t,e){try{return t[e]}catch(t){}}(e=Object(t),W))?r:k?V(e):"Object"==(n=V(e))&&"function"==typeof e.callee?"Arguments":n},N=f.document,Y=l(N)&&l(N.createElement),B=!o&&!n((function(){return 7!=Object.defineProperty((t="div",Y?N.createElement(t):{}),"a",{get:function(){return 7}}).a;var t})),G=function(t){if(!l(t))throw TypeError(String(t)+" is not an object");return t},J=P?function(t){return"symbol"==typeof t}:function(t){var e=T("Symbol");return"function"==typeof e&&Object(t)instanceof e},Z=D("toPrimitive"),H=function(t,e){if(!l(t)||J(t))return t;var r,n=t[Z];if(void 0!==n){if(void 0===e&&(e="default"),r=n.call(t,e),!l(r)||J(r))return r;throw TypeError("Can't convert object to primitive value")}return void 0===e&&(e="number"),function(t,e){var r,n;if("string"===e&&"function"==typeof(r=t.toString)&&!l(n=r.call(t)))return n;if("function"==typeof(r=t.valueOf)&&!l(n=r.call(t)))return n;if("string"!==e&&"function"==typeof(r=t.toString)&&!l(n=r.call(t)))return n;throw TypeError("Can't convert object to primitive value")}(t,e)},K=Object.defineProperty,X={f:o?K:function(t,e,r){var n;if(G(t),n=H(e,"string"),e=J(n)?n:String(n),G(r),B)try{return K(t,e,r)}catch(t){}if("get"in r||"set"in r)throw TypeError("Accessors not supported");return"value"in r&&(t[e]=r.value),t}},Q=o?function(t,e,r){return X.f(t,e,function(t,e){return{enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:e}}(1,r))}:function(t,e,r){return t[e]=r,t},$=Function.toString;"function"!=typeof v.inspectSource&&(v.inspectSource=function(t){return $.call(t)});var tt,et,rt,nt=v.inspectSource,ot=f.WeakMap,it="function"==typeof ot&&/native code/.test(nt(ot)),at=b("keys"),ut=function(t){return at[t]||(at[t]=S(t))},ct="Object already initialized",st=f.WeakMap;if(it||v.state){var ft=v.state||(v.state=new st),lt=ft.get,pt=ft.has,yt=ft.set;tt=function(t,e){if(pt.call(ft,t))throw new TypeError(ct);return e.facade=t,yt.call(ft,t,e),e},et=function(t){return lt.call(ft,t)||{}},rt=function(t){return pt.call(ft,t)}}else{var ht=ut("state");tt=function(t,e){if(h(t,ht))throw new TypeError(ct);return e.facade=t,Q(t,ht,e),e},et=function(t){return h(t,ht)?t[ht]:{}},rt=function(t){return h(t,ht)}}var dt,gt,vt,bt={set:tt,get:et,has:rt,enforce:function(t){return rt(t)?et(t):tt(t,{})},getterFor:function(t){return function(e){var r;if(!l(e)||(r=et(e)).type!==t)throw TypeError("Incompatible receiver, "+t+" required");return r}}},mt=a((function(t){var e=bt.get,r=bt.enforce,n=String(String).split("String");(t.exports=function(t,e,o,i){var a,u=!!i&&!!i.unsafe,c=!!i&&!!i.enumerable,s=!!i&&!!i.noTargetGet;"function"==typeof o&&("string"!=typeof e||h(o,"name")||Q(o,"name",e),(a=r(o)).source||(a.source=n.join("string"==typeof e?e:""))),t!==f?(u?!s&&t[e]&&(c=!0):delete t[e],c?t[e]=o:Q(t,e,o)):c?t[e]=o:d(e,o)})(Function.prototype,"toString",(function(){return"function"==typeof this&&e(this).source||nt(this)}))})),wt=!n((function(){function t(){}return t.prototype.constructor=null,Object.getPrototypeOf(new t)!==t.prototype})),St=ut("IE_PROTO"),Ot=Object.prototype,Tt=wt?Object.getPrototypeOf:function(t){return t=p(t),h(t,St)?t[St]:"function"==typeof t.constructor&&t instanceof t.constructor?t.constructor.prototype:t instanceof Object?Ot:null},At=Object.setPrototypeOf||("__proto__"in{}?function(){var t,e=!1,r={};try{(t=Object.getOwnPropertyDescriptor(Object.prototype,"__proto__").set).call(r,[]),e=r instanceof Array}catch(t){}return function(r,n){return G(r),function(t){if(!l(t)&&null!==t)throw TypeError("Can't set "+String(t)+" as a prototype")}(n),e?t.call(r,n):r.__proto__=n,r}}():void 0),jt=X.f,Mt=f.Int8Array,_t=Mt&&Mt.prototype,xt=f.Uint8ClampedArray,Rt=xt&&xt.prototype,Et=Mt&&Tt(Mt),Pt=_t&&Tt(_t),Ct=Object.prototype,It=(Ct.isPrototypeOf,D("toStringTag")),Lt=S("TYPED_ARRAY_TAG"),Dt=S("TYPED_ARRAY_CONSTRUCTOR"),Ut=r&&!!At&&"Opera"!==q(f.opera),Ft={Int8Array:1,Uint8Array:1,Uint8ClampedArray:1,Int16Array:2,Uint16Array:2,Int32Array:4,Uint32Array:4,Float32Array:4,Float64Array:8},zt={BigInt64Array:8,BigUint64Array:8},Vt=function(t){if(!l(t))return!1;var e=q(t);return h(Ft,e)||h(zt,e)};for(dt in Ft)(vt=(gt=f[dt])&&gt.prototype)?Q(vt,Dt,gt):Ut=!1;for(dt in zt)(vt=(gt=f[dt])&&gt.prototype)&&Q(vt,Dt,gt);if((!Ut||"function"!=typeof Et||Et===Function.prototype)&&(Et=function(){throw TypeError("Incorrect invocation")},Ut))for(dt in Ft)f[dt]&&At(f[dt],Et);if((!Ut||!Pt||Pt===Ct)&&(Pt=Et.prototype,Ut))for(dt in Ft)f[dt]&&At(f[dt].prototype,Pt);if(Ut&&Tt(Rt)!==Pt&&At(Rt,Pt),o&&!h(Pt,It))for(dt in!0,jt(Pt,It,{get:function(){return l(this)?this[Lt]:void 0}}),Ft)f[dt]&&Q(f[dt],Lt,dt);var Wt=function(t){if(Vt(t))return t;throw TypeError("Target is not a typed array")},kt=function(t,e,r){if(o){if(r)for(var n in Ft){var i=f[n];if(i&&h(i.prototype,t))try{delete i.prototype[t]}catch(t){}}Pt[t]&&!r||mt(Pt,t,r?e:Ut&&_t[t]||e)}},qt=Math.ceil,Nt=Math.floor,Yt=Math.min,Bt=function(t){return t>0?Yt(function(t){return isNaN(t=+t)?0:(t>0?Nt:qt)(t)}(t),9007199254740991):0},Gt=Math.floor,Jt=function(t,e){var r=t.length,n=Gt(r/2);return r<8?Zt(t,e):Ht(Jt(t.slice(0,n),e),Jt(t.slice(n),e),e)},Zt=function(t,e){for(var r,n,o=t.length,i=1;i<o;){for(n=i,r=t[i];n&&e(t[n-1],r)>0;)t[n]=t[--n];n!==i++&&(t[n]=r)}return t},Ht=function(t,e,r){for(var n=t.length,o=e.length,i=0,a=0,u=[];i<n||a<o;)i<n&&a<o?u.push(r(t[i],e[a])<=0?t[i++]:e[a++]):u.push(i<n?t[i++]:e[a++]);return u},Kt=Jt,Xt=A.match(/firefox\/(\d+)/i),Qt=!!Xt&&+Xt[1],$t=/MSIE|Trident/.test(A),te=A.match(/AppleWebKit\/(\d+)\./),ee=!!te&&+te[1],re=Wt,ne=kt,oe=f.Uint16Array,ie=oe&&oe.prototype.sort,ae=!!ie&&!n((function(){var t=new oe(2);t.sort(null),t.sort({})})),ue=!!ie&&!n((function(){if(R)return R<74;if(Qt)return Qt<67;if($t)return!0;if(ee)return ee<602;var t,e,r=new oe(516),n=Array(516);for(t=0;t<516;t++)e=t%4,r[t]=515-t,n[t]=t-2*e+3;for(r.sort((function(t,e){return(t/4|0)-(e/4|0)})),t=0;t<516;t++)if(r[t]!==n[t])return!0}));ne("sort",(function(t){var e=this;if(void 0!==t&&function(t){if("function"!=typeof t)throw TypeError(String(t)+" is not a function")}(t),ue)return ie.call(e,t);re(e);var r,n=Bt(e.length),o=Array(n);for(r=0;r<n;r++)o[r]=e[r];for(o=Kt(e,function(t){return function(e,r){return void 0!==t?+t(e,r)||0:r!=r?-1:e!=e?1:0===e&&0===r?1/e>0&&1/r<0?1:-1:e>r}}(t)),r=0;r<n;r++)e[r]=o[r];return e}),!ue||ae);const ce=6371010,se=Math.PI*ce;function fe(t){t=function(t){return window.google&&google.maps&&t instanceof google.maps.LatLng?t.toJSON():t}(t);return{x:ce*e.MathUtils.degToRad(t.lng),y:0-ce*Math.log(Math.tan(.5*(.5*Math.PI-e.MathUtils.degToRad(t.lat))))}}function le(t,r=new e.Vector3){const{x:n,y:o}=fe(t);return r.set(n,0,-o)}t.EARTH_RADIUS=ce,t.ThreeJSOverlayView=class{constructor({anchor:t={lat:0,lng:0,altitude:0},rotation:r=new Float32Array([0,0,0]),scale:n=new Float32Array([1,1,1]),scene:o=new e.Scene,map:i}){this.overlay=new google.maps.WebglOverlayView,this.renderer=null,this.camera=null,this.anchor=t,this.rotation=r,this.scale=n,this.scene=o,this.scene.rotation.x=Math.PI/2,this.overlay.onAdd=this.onAdd.bind(this),this.overlay.onRemove=this.onRemove.bind(this),this.overlay.onContextLost=this.onContextLost.bind(this),this.overlay.onContextRestored=this.onContextRestored.bind(this),this.overlay.onDraw=this.onDraw.bind(this),this.camera=new e.PerspectiveCamera,i&&this.setMap(i)}onAdd(){}onRemove(){}getMap(){return this.overlay.getMap()}requestRedraw(){this.overlay.requestRedraw()}setMap(t){this.overlay.setMap(t)}addListener(t,e){return this.overlay.addListener(t,e)}bindTo(t,e,r,n){this.overlay.bindTo(t,e,r,n)}get(t){return this.overlay.get(t)}notify(t){this.overlay.notify(t)}set(t,e){this.overlay.set(t,e)}setValues(t){this.overlay.setValues(t)}unbind(t){this.overlay.unbind(t)}unbindAll(){this.overlay.unbindAll()}onContextRestored(t){this.renderer=new e.WebGLRenderer(Object.assign({canvas:t.canvas,context:t},t.getContextAttributes())),this.renderer.autoClear=!1,this.renderer.autoClearDepth=!1,this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=e.PCFSoftShadowMap,this.renderer.outputEncoding=e.sRGBEncoding;const{width:r,height:n,clientWidth:o}=t.canvas;this.renderer.setPixelRatio(r/o),this.renderer.setSize(r,n,!1)}onContextLost(){this.renderer&&(this.renderer.dispose(),this.renderer=null)}onDraw(t,e){const{lat:r,lng:n,altitude:o}=this.anchor;this.camera.projectionMatrix.fromArray(e.fromLatLngAltitude({lat:r,lng:n},o,this.rotation,this.scale)),t.disable(t.SCISSOR_TEST),this.requestRedraw(),this.renderer.render(this.scene,this.camera),this.renderer.resetState()}},t.WORLD_SIZE=se,t.latLngToMeters=fe,t.latLngToVector3=le,t.latLngToVector3Relative=function(t,r,n=new e.Vector3){const o=le(t),i=le(r);return n.setX((i.x-o.x)*Math.sign(o.x-i.x)),n.setY((i.y-o.y)*Math.sign(o.y-i.y)),n.setZ((i.z-o.z)*Math.sign(o.z-i.z)),n},Object.defineProperty(t,"__esModule",{value:!0})}));
