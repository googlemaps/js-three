this.google=this.google||{},this.google.maps=this.google.maps||{},this.google.maps.plugins=this.google.maps.plugins||{},this.google.maps.plugins.three=function(t,e){"use strict";var r="undefined"!=typeof ArrayBuffer&&"undefined"!=typeof DataView,n=function(t){try{return!!t()}catch(t){return!0}},o=!n((function(){return 7!=Object.defineProperty({},1,{get:function(){return 7}})[1]})),i="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};function a(t,e){return t(e={exports:{}},e.exports),e.exports}var u,s,c=function(t){return t&&t.Math==Math&&t},f=c("object"==typeof globalThis&&globalThis)||c("object"==typeof window&&window)||c("object"==typeof self&&self)||c("object"==typeof i&&i)||function(){return this}()||Function("return this")(),l=function(t){return"object"==typeof t?null!==t:"function"==typeof t},h=function(t){return Object(function(t){if(null==t)throw TypeError("Can't call method on "+t);return t}(t))},p={}.hasOwnProperty,y=Object.hasOwn||function(t,e){return p.call(h(t),e)},d=f.document,g=l(d)&&l(d.createElement),v=!o&&!n((function(){return 7!=Object.defineProperty((t="div",g?d.createElement(t):{}),"a",{get:function(){return 7}}).a;var t})),b=function(t){if(!l(t))throw TypeError(String(t)+" is not an object");return t},w=Object.defineProperty,m={f:o?w:function(t,e,r){if(b(t),e=function(t,e){if(!l(t))return t;var r,n;if(e&&"function"==typeof(r=t.toString)&&!l(n=r.call(t)))return n;if("function"==typeof(r=t.valueOf)&&!l(n=r.call(t)))return n;if(!e&&"function"==typeof(r=t.toString)&&!l(n=r.call(t)))return n;throw TypeError("Can't convert object to primitive value")}(e,!0),b(r),v)try{return w(t,e,r)}catch(t){}if("get"in r||"set"in r)throw TypeError("Accessors not supported");return"value"in r&&(t[e]=r.value),t}},S=o?function(t,e,r){return m.f(t,e,function(t,e){return{enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:e}}(1,r))}:function(t,e,r){return t[e]=r,t},A=function(t,e){try{S(f,t,e)}catch(r){f[t]=e}return e},O="__core-js_shared__",T=f[O]||A(O,{}),j=a((function(t){(t.exports=function(t,e){return T[t]||(T[t]=void 0!==e?e:{})})("versions",[]).push({version:"3.15.2",mode:"global",copyright:"© 2021 Denis Pushkarev (zloirock.ru)"})})),M=0,_=Math.random(),x=function(t){return"Symbol("+String(void 0===t?"":t)+")_"+(++M+_).toString(36)},E=f,R=function(t){return"function"==typeof t?t:void 0},P=function(t,e){return arguments.length<2?R(E[t])||R(f[t]):E[t]&&E[t][e]||f[t]&&f[t][e]}("navigator","userAgent")||"",C=f.process,I=C&&C.versions,L=I&&I.v8;L?s=(u=L.split("."))[0]<4?1:u[0]+u[1]:P&&(!(u=P.match(/Edge\/(\d+)/))||u[1]>=74)&&(u=P.match(/Chrome\/(\d+)/))&&(s=u[1]);var U=s&&+s,D=!!Object.getOwnPropertySymbols&&!n((function(){var t=Symbol();return!String(t)||!(Object(t)instanceof Symbol)||!Symbol.sham&&U&&U<41})),F=D&&!Symbol.sham&&"symbol"==typeof Symbol.iterator,z=j("wks"),V=f.Symbol,W=F?V:V&&V.withoutSetter||x,k=function(t){return y(z,t)&&(D||"string"==typeof z[t])||(D&&y(V,t)?z[t]=V[t]:z[t]=W("Symbol."+t)),z[t]},q={};q[k("toStringTag")]="z";var B="[object z]"===String(q),G={}.toString,N=function(t){return G.call(t).slice(8,-1)},Y=k("toStringTag"),J="Arguments"==N(function(){return arguments}()),Z=B?N:function(t){var e,r,n;return void 0===t?"Undefined":null===t?"Null":"string"==typeof(r=function(t,e){try{return t[e]}catch(t){}}(e=Object(t),Y))?r:J?N(e):"Object"==(n=N(e))&&"function"==typeof e.callee?"Arguments":n},H=Function.toString;"function"!=typeof T.inspectSource&&(T.inspectSource=function(t){return H.call(t)});var K,X,Q,$=T.inspectSource,tt=f.WeakMap,et="function"==typeof tt&&/native code/.test($(tt)),rt=j("keys"),nt=function(t){return rt[t]||(rt[t]=x(t))},ot="Object already initialized",it=f.WeakMap;if(et||T.state){var at=T.state||(T.state=new it),ut=at.get,st=at.has,ct=at.set;K=function(t,e){if(st.call(at,t))throw new TypeError(ot);return e.facade=t,ct.call(at,t,e),e},X=function(t){return ut.call(at,t)||{}},Q=function(t){return st.call(at,t)}}else{var ft=nt("state");K=function(t,e){if(y(t,ft))throw new TypeError(ot);return e.facade=t,S(t,ft,e),e},X=function(t){return y(t,ft)?t[ft]:{}},Q=function(t){return y(t,ft)}}var lt,ht={set:K,get:X,has:Q,enforce:function(t){return Q(t)?X(t):K(t,{})},getterFor:function(t){return function(e){var r;if(!l(e)||(r=X(e)).type!==t)throw TypeError("Incompatible receiver, "+t+" required");return r}}},pt=a((function(t){var e=ht.get,r=ht.enforce,n=String(String).split("String");(t.exports=function(t,e,o,i){var a,u=!!i&&!!i.unsafe,s=!!i&&!!i.enumerable,c=!!i&&!!i.noTargetGet;"function"==typeof o&&("string"!=typeof e||y(o,"name")||S(o,"name",e),(a=r(o)).source||(a.source=n.join("string"==typeof e?e:""))),t!==f?(u?!c&&t[e]&&(s=!0):delete t[e],s?t[e]=o:S(t,e,o)):s?t[e]=o:A(e,o)})(Function.prototype,"toString",(function(){return"function"==typeof this&&e(this).source||$(this)}))})),yt=!n((function(){function t(){}return t.prototype.constructor=null,Object.getPrototypeOf(new t)!==t.prototype})),dt=nt("IE_PROTO"),gt=Object.prototype,vt=yt?Object.getPrototypeOf:function(t){return t=h(t),y(t,dt)?t[dt]:"function"==typeof t.constructor&&t instanceof t.constructor?t.constructor.prototype:t instanceof Object?gt:null},bt=Object.setPrototypeOf||("__proto__"in{}?function(){var t,e=!1,r={};try{(t=Object.getOwnPropertyDescriptor(Object.prototype,"__proto__").set).call(r,[]),e=r instanceof Array}catch(t){}return function(r,n){return b(r),function(t){if(!l(t)&&null!==t)throw TypeError("Can't set "+String(t)+" as a prototype")}(n),e?t.call(r,n):r.__proto__=n,r}}():void 0),wt=m.f,mt=f.Int8Array,St=mt&&mt.prototype,At=f.Uint8ClampedArray,Ot=At&&At.prototype,Tt=mt&&vt(mt),jt=St&&vt(St),Mt=Object.prototype,_t=(Mt.isPrototypeOf,k("toStringTag")),xt=x("TYPED_ARRAY_TAG"),Et=r&&!!bt&&"Opera"!==Z(f.opera),Rt={Int8Array:1,Uint8Array:1,Uint8ClampedArray:1,Int16Array:2,Uint16Array:2,Int32Array:4,Uint32Array:4,Float32Array:4,Float64Array:8},Pt={BigInt64Array:8,BigUint64Array:8},Ct=function(t){if(!l(t))return!1;var e=Z(t);return y(Rt,e)||y(Pt,e)};for(lt in Rt)f[lt]||(Et=!1);if((!Et||"function"!=typeof Tt||Tt===Function.prototype)&&(Tt=function(){throw TypeError("Incorrect invocation")},Et))for(lt in Rt)f[lt]&&bt(f[lt],Tt);if((!Et||!jt||jt===Mt)&&(jt=Tt.prototype,Et))for(lt in Rt)f[lt]&&bt(f[lt].prototype,jt);if(Et&&vt(Ot)!==jt&&bt(Ot,jt),o&&!y(jt,_t))for(lt in!0,wt(jt,_t,{get:function(){return l(this)?this[xt]:void 0}}),Rt)f[lt]&&S(f[lt],xt,lt);var It=function(t){if(Ct(t))return t;throw TypeError("Target is not a typed array")},Lt=function(t,e,r){if(o){if(r)for(var n in Rt){var i=f[n];if(i&&y(i.prototype,t))try{delete i.prototype[t]}catch(t){}}jt[t]&&!r||pt(jt,t,r?e:Et&&St[t]||e)}},Ut=Math.ceil,Dt=Math.floor,Ft=Math.min,zt=function(t){return t>0?Ft(function(t){return isNaN(t=+t)?0:(t>0?Dt:Ut)(t)}(t),9007199254740991):0},Vt=Math.floor,Wt=function(t,e){var r=t.length,n=Vt(r/2);return r<8?kt(t,e):qt(Wt(t.slice(0,n),e),Wt(t.slice(n),e),e)},kt=function(t,e){for(var r,n,o=t.length,i=1;i<o;){for(n=i,r=t[i];n&&e(t[n-1],r)>0;)t[n]=t[--n];n!==i++&&(t[n]=r)}return t},qt=function(t,e,r){for(var n=t.length,o=e.length,i=0,a=0,u=[];i<n||a<o;)i<n&&a<o?u.push(r(t[i],e[a])<=0?t[i++]:e[a++]):u.push(i<n?t[i++]:e[a++]);return u},Bt=Wt,Gt=P.match(/firefox\/(\d+)/i),Nt=!!Gt&&+Gt[1],Yt=/MSIE|Trident/.test(P),Jt=P.match(/AppleWebKit\/(\d+)\./),Zt=!!Jt&&+Jt[1],Ht=It,Kt=Lt,Xt=f.Uint16Array,Qt=Xt&&Xt.prototype.sort,$t=!!Qt&&!n((function(){var t=new Xt(2);t.sort(null),t.sort({})})),te=!!Qt&&!n((function(){if(U)return U<74;if(Nt)return Nt<67;if(Yt)return!0;if(Zt)return Zt<602;var t,e,r=new Xt(516),n=Array(516);for(t=0;t<516;t++)e=t%4,r[t]=515-t,n[t]=t-2*e+3;for(r.sort((function(t,e){return(t/4|0)-(e/4|0)})),t=0;t<516;t++)if(r[t]!==n[t])return!0}));Kt("sort",(function(t){var e=this;if(void 0!==t&&function(t){if("function"!=typeof t)throw TypeError(String(t)+" is not a function")}(t),te)return Qt.call(e,t);Ht(e);var r,n=zt(e.length),o=Array(n);for(r=0;r<n;r++)o[r]=e[r];for(o=Bt(e,function(t){return function(e,r){return void 0!==t?+t(e,r)||0:r!=r?-1:e!=e?1:0===e&&0===r?1/e>0&&1/r<0?1:-1:e>r}}(t)),r=0;r<n;r++)e[r]=o[r];return e}),!te||$t);const ee=6371010,re=Math.PI*ee;function ne(t){t=function(t){return window.google&&google.maps&&t instanceof google.maps.LatLng?t.toJSON():t}(t);return{x:ee*e.MathUtils.degToRad(t.lng),y:0-ee*Math.log(Math.tan(.5*(.5*Math.PI-e.MathUtils.degToRad(t.lat))))}}function oe(t,r=new e.Vector3){const{x:n,y:o}=ne(t);return r.set(n,0,-o)}return t.EARTH_RADIUS=ee,t.ThreeJSOverlayView=class{constructor({anchor:t={lat:0,lng:0,altitude:0},rotation:r=new Float32Array([0,0,0]),scale:n=new Float32Array([1,1,1]),scene:o=new e.Scene,map:i}){this.overlay=new google.maps.WebglOverlayView,this.renderer=null,this.camera=null,this.anchor=t,this.rotation=r,this.scale=n,this.scene=o,this.scene.rotation.x=Math.PI/2,this.overlay.onAdd=this.onAdd.bind(this),this.overlay.onRemove=this.onRemove.bind(this),this.overlay.onContextLost=this.onContextLost.bind(this),this.overlay.onContextRestored=this.onContextRestored.bind(this),this.overlay.onDraw=this.onDraw.bind(this),this.camera=new e.PerspectiveCamera,i&&this.setMap(i)}onAdd(){}onRemove(){}getMap(){return this.overlay.getMap()}requestRedraw(){this.overlay.requestRedraw()}setMap(t){this.overlay.setMap(t)}addListener(t,e){return this.overlay.addListener(t,e)}bindTo(t,e,r,n){this.overlay.bindTo(t,e,r,n)}get(t){return this.overlay.get(t)}notify(t){this.overlay.notify(t)}set(t,e){this.overlay.set(t,e)}setValues(t){this.overlay.setValues(t)}unbind(t){this.overlay.unbind(t)}unbindAll(){this.overlay.unbindAll()}onContextRestored(t){this.renderer=new e.WebGLRenderer(Object.assign({canvas:t.canvas,context:t},t.getContextAttributes())),this.renderer.autoClear=!1,this.renderer.autoClearDepth=!1,this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=e.PCFSoftShadowMap,this.renderer.outputEncoding=e.sRGBEncoding;const{width:r,height:n,clientWidth:o}=t.canvas;this.renderer.setPixelRatio(r/o),this.renderer.setSize(r,n,!1)}onContextLost(){this.renderer&&(this.renderer.dispose(),this.renderer=null)}onDraw(t,e){const{lat:r,lng:n,altitude:o}=this.anchor;this.camera.projectionMatrix.fromArray(e.fromLatLngAltitude({lat:r,lng:n},o,this.rotation,this.scale)),t.disable(t.SCISSOR_TEST),this.requestRedraw(),this.renderer.render(this.scene,this.camera),this.renderer.resetState()}},t.WORLD_SIZE=re,t.latLngToMeters=ne,t.latLngToVector3=oe,t.latLngToVector3Relative=function(t,r,n=new e.Vector3){const o=oe(t),i=oe(r);return n.setX((i.x-o.x)*Math.sign(o.x-i.x)),n.setY((i.y-o.y)*Math.sign(o.y-i.y)),n.setZ((i.z-o.z)*Math.sign(o.z-i.z)),n},Object.defineProperty(t,"__esModule",{value:!0}),t}({},three);
//# sourceMappingURL=index.dev.js.map
