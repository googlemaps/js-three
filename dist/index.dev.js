this.google=this.google||{},this.google.maps=this.google.maps||{},this.google.maps.plugins=this.google.maps.plugins||{},this.google.maps.plugins.three=function(t,r){"use strict";var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{},n={exports:{}},o=function(t){return t&&t.Math===Math&&t},i=o("object"==typeof globalThis&&globalThis)||o("object"==typeof window&&window)||o("object"==typeof self&&self)||o("object"==typeof e&&e)||o("object"==typeof e&&e)||function(){return this}()||Function("return this")(),a={},u=function(t){try{return!!t()}catch(t){return!0}},c=!u((function(){return 7!==Object.defineProperty({},1,{get:function(){return 7}})[1]})),s=!u((function(){var t=function(){}.bind();return"function"!=typeof t||t.hasOwnProperty("prototype")})),f=s,l=Function.prototype.call,h=f?l.bind(l):function(){return l.apply(l,arguments)},y={},p={}.propertyIsEnumerable,g=Object.getOwnPropertyDescriptor,v=g&&!p.call({1:2},1);y.f=v?function(t){var r=g(this,t);return!!r&&r.enumerable}:p;var d,b,w=function(t,r){return{enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:r}},m=s,A=Function.prototype,S=A.call,O=m&&A.bind.bind(S,S),T=m?O:function(t){return function(){return S.apply(t,arguments)}},L=T,E=L({}.toString),I=L("".slice),R=function(t){return I(E(t),8,-1)},M=u,j=R,x=Object,P=T("".split),_=M((function(){return!x("z").propertyIsEnumerable(0)}))?function(t){return"String"===j(t)?P(t,""):x(t)}:x,F=function(t){return null==t},C=F,U=TypeError,D=function(t){if(C(t))throw new U("Can't call method on "+t);return t},V=_,B=D,N=function(t){return V(B(t))},k="object"==typeof document&&document.all,G=void 0===k&&void 0!==k?function(t){return"function"==typeof t||t===k}:function(t){return"function"==typeof t},W=G,Y=function(t){return"object"==typeof t?null!==t:W(t)},z=i,q=G,H=function(t,r){return arguments.length<2?(e=z[t],q(e)?e:void 0):z[t]&&z[t][r];var e},Q=T({}.isPrototypeOf),X="undefined"!=typeof navigator&&String(navigator.userAgent)||"",Z=i,J=X,K=Z.process,$=Z.Deno,tt=K&&K.versions||$&&$.version,rt=tt&&tt.v8;rt&&(b=(d=rt.split("."))[0]>0&&d[0]<4?1:+(d[0]+d[1])),!b&&J&&(!(d=J.match(/Edge\/(\d+)/))||d[1]>=74)&&(d=J.match(/Chrome\/(\d+)/))&&(b=+d[1]);var et=b,nt=et,ot=u,it=i.String,at=!!Object.getOwnPropertySymbols&&!ot((function(){var t=Symbol("symbol detection");return!it(t)||!(Object(t)instanceof Symbol)||!Symbol.sham&&nt&&nt<41})),ut=at&&!Symbol.sham&&"symbol"==typeof Symbol.iterator,ct=H,st=G,ft=Q,lt=Object,ht=ut?function(t){return"symbol"==typeof t}:function(t){var r=ct("Symbol");return st(r)&&ft(r.prototype,lt(t))},yt=String,pt=function(t){try{return yt(t)}catch(t){return"Object"}},gt=G,vt=pt,dt=TypeError,bt=function(t){if(gt(t))return t;throw new dt(vt(t)+" is not a function")},wt=bt,mt=F,At=function(t,r){var e=t[r];return mt(e)?void 0:wt(e)},St=h,Ot=G,Tt=Y,Lt=TypeError,Et={exports:{}},It=i,Rt=Object.defineProperty,Mt=function(t,r){try{Rt(It,t,{value:r,configurable:!0,writable:!0})}catch(e){It[t]=r}return r},jt=i,xt=Mt,Pt="__core-js_shared__",_t=Et.exports=jt[Pt]||xt(Pt,{});(_t.versions||(_t.versions=[])).push({version:"3.37.1",mode:"global",copyright:"© 2014-2024 Denis Pushkarev (zloirock.ru)",license:"https://github.com/zloirock/core-js/blob/v3.37.1/LICENSE",source:"https://github.com/zloirock/core-js"});var Ft=Et.exports,Ct=Ft,Ut=function(t,r){return Ct[t]||(Ct[t]=r||{})},Dt=D,Vt=Object,Bt=function(t){return Vt(Dt(t))},Nt=Bt,kt=T({}.hasOwnProperty),Gt=Object.hasOwn||function(t,r){return kt(Nt(t),r)},Wt=T,Yt=0,zt=Math.random(),qt=Wt(1..toString),Ht=function(t){return"Symbol("+(void 0===t?"":t)+")_"+qt(++Yt+zt,36)},Qt=Ut,Xt=Gt,Zt=Ht,Jt=at,Kt=ut,$t=i.Symbol,tr=Qt("wks"),rr=Kt?$t.for||$t:$t&&$t.withoutSetter||Zt,er=function(t){return Xt(tr,t)||(tr[t]=Jt&&Xt($t,t)?$t[t]:rr("Symbol."+t)),tr[t]},nr=h,or=Y,ir=ht,ar=At,ur=function(t,r){var e,n;if("string"===r&&Ot(e=t.toString)&&!Tt(n=St(e,t)))return n;if(Ot(e=t.valueOf)&&!Tt(n=St(e,t)))return n;if("string"!==r&&Ot(e=t.toString)&&!Tt(n=St(e,t)))return n;throw new Lt("Can't convert object to primitive value")},cr=TypeError,sr=er("toPrimitive"),fr=function(t,r){if(!or(t)||ir(t))return t;var e,n=ar(t,sr);if(n){if(void 0===r&&(r="default"),e=nr(n,t,r),!or(e)||ir(e))return e;throw new cr("Can't convert object to primitive value")}return void 0===r&&(r="number"),ur(t,r)},lr=fr,hr=ht,yr=function(t){var r=lr(t,"string");return hr(r)?r:r+""},pr=Y,gr=i.document,vr=pr(gr)&&pr(gr.createElement),dr=function(t){return vr?gr.createElement(t):{}},br=dr,wr=!c&&!u((function(){return 7!==Object.defineProperty(br("div"),"a",{get:function(){return 7}}).a})),mr=c,Ar=h,Sr=y,Or=w,Tr=N,Lr=yr,Er=Gt,Ir=wr,Rr=Object.getOwnPropertyDescriptor;a.f=mr?Rr:function(t,r){if(t=Tr(t),r=Lr(r),Ir)try{return Rr(t,r)}catch(t){}if(Er(t,r))return Or(!Ar(Sr.f,t,r),t[r])};var Mr={},jr=c&&u((function(){return 42!==Object.defineProperty((function(){}),"prototype",{value:42,writable:!1}).prototype})),xr=Y,Pr=String,_r=TypeError,Fr=function(t){if(xr(t))return t;throw new _r(Pr(t)+" is not an object")},Cr=c,Ur=wr,Dr=jr,Vr=Fr,Br=yr,Nr=TypeError,kr=Object.defineProperty,Gr=Object.getOwnPropertyDescriptor,Wr="enumerable",Yr="configurable",zr="writable";Mr.f=Cr?Dr?function(t,r,e){if(Vr(t),r=Br(r),Vr(e),"function"==typeof t&&"prototype"===r&&"value"in e&&zr in e&&!e[zr]){var n=Gr(t,r);n&&n[zr]&&(t[r]=e.value,e={configurable:Yr in e?e[Yr]:n[Yr],enumerable:Wr in e?e[Wr]:n[Wr],writable:!1})}return kr(t,r,e)}:kr:function(t,r,e){if(Vr(t),r=Br(r),Vr(e),Ur)try{return kr(t,r,e)}catch(t){}if("get"in e||"set"in e)throw new Nr("Accessors not supported");return"value"in e&&(t[r]=e.value),t};var qr=Mr,Hr=w,Qr=c?function(t,r,e){return qr.f(t,r,Hr(1,e))}:function(t,r,e){return t[r]=e,t},Xr={exports:{}},Zr=c,Jr=Gt,Kr=Function.prototype,$r=Zr&&Object.getOwnPropertyDescriptor,te=Jr(Kr,"name"),re={EXISTS:te,PROPER:te&&"something"===function(){}.name,CONFIGURABLE:te&&(!Zr||Zr&&$r(Kr,"name").configurable)},ee=G,ne=Ft,oe=T(Function.toString);ee(ne.inspectSource)||(ne.inspectSource=function(t){return oe(t)});var ie,ae,ue,ce=ne.inspectSource,se=G,fe=i.WeakMap,le=se(fe)&&/native code/.test(String(fe)),he=Ht,ye=Ut("keys"),pe=function(t){return ye[t]||(ye[t]=he(t))},ge={},ve=le,de=i,be=Y,we=Qr,me=Gt,Ae=Ft,Se=pe,Oe=ge,Te="Object already initialized",Le=de.TypeError,Ee=de.WeakMap;if(ve||Ae.state){var Ie=Ae.state||(Ae.state=new Ee);Ie.get=Ie.get,Ie.has=Ie.has,Ie.set=Ie.set,ie=function(t,r){if(Ie.has(t))throw new Le(Te);return r.facade=t,Ie.set(t,r),r},ae=function(t){return Ie.get(t)||{}},ue=function(t){return Ie.has(t)}}else{var Re=Se("state");Oe[Re]=!0,ie=function(t,r){if(me(t,Re))throw new Le(Te);return r.facade=t,we(t,Re,r),r},ae=function(t){return me(t,Re)?t[Re]:{}},ue=function(t){return me(t,Re)}}var Me={set:ie,get:ae,has:ue,enforce:function(t){return ue(t)?ae(t):ie(t,{})},getterFor:function(t){return function(r){var e;if(!be(r)||(e=ae(r)).type!==t)throw new Le("Incompatible receiver, "+t+" required");return e}}},je=T,xe=u,Pe=G,_e=Gt,Fe=c,Ce=re.CONFIGURABLE,Ue=ce,De=Me.enforce,Ve=Me.get,Be=String,Ne=Object.defineProperty,ke=je("".slice),Ge=je("".replace),We=je([].join),Ye=Fe&&!xe((function(){return 8!==Ne((function(){}),"length",{value:8}).length})),ze=String(String).split("String"),qe=Xr.exports=function(t,r,e){"Symbol("===ke(Be(r),0,7)&&(r="["+Ge(Be(r),/^Symbol\(([^)]*)\).*$/,"$1")+"]"),e&&e.getter&&(r="get "+r),e&&e.setter&&(r="set "+r),(!_e(t,"name")||Ce&&t.name!==r)&&(Fe?Ne(t,"name",{value:r,configurable:!0}):t.name=r),Ye&&e&&_e(e,"arity")&&t.length!==e.arity&&Ne(t,"length",{value:e.arity});try{e&&_e(e,"constructor")&&e.constructor?Fe&&Ne(t,"prototype",{writable:!1}):t.prototype&&(t.prototype=void 0)}catch(t){}var n=De(t);return _e(n,"source")||(n.source=We(ze,"string"==typeof r?r:"")),t};Function.prototype.toString=qe((function(){return Pe(this)&&Ve(this).source||Ue(this)}),"toString");var He=Xr.exports,Qe=G,Xe=Mr,Ze=He,Je=Mt,Ke=function(t,r,e,n){n||(n={});var o=n.enumerable,i=void 0!==n.name?n.name:r;if(Qe(e)&&Ze(e,i,n),n.global)o?t[r]=e:Je(r,e);else{try{n.unsafe?t[r]&&(o=!0):delete t[r]}catch(t){}o?t[r]=e:Xe.f(t,r,{value:e,enumerable:!1,configurable:!n.nonConfigurable,writable:!n.nonWritable})}return t},$e={},tn=Math.ceil,rn=Math.floor,en=Math.trunc||function(t){var r=+t;return(r>0?rn:tn)(r)},nn=function(t){var r=+t;return r!=r||0===r?0:en(r)},on=nn,an=Math.max,un=Math.min,cn=function(t,r){var e=on(t);return e<0?an(e+r,0):un(e,r)},sn=nn,fn=Math.min,ln=function(t){var r=sn(t);return r>0?fn(r,9007199254740991):0},hn=ln,yn=function(t){return hn(t.length)},pn=N,gn=cn,vn=yn,dn=function(t){return function(r,e,n){var o=pn(r),i=vn(o);if(0===i)return!t&&-1;var a,u=gn(n,i);if(t&&e!=e){for(;i>u;)if((a=o[u++])!=a)return!0}else for(;i>u;u++)if((t||u in o)&&o[u]===e)return t||u||0;return!t&&-1}},bn={includes:dn(!0),indexOf:dn(!1)},wn=Gt,mn=N,An=bn.indexOf,Sn=ge,On=T([].push),Tn=function(t,r){var e,n=mn(t),o=0,i=[];for(e in n)!wn(Sn,e)&&wn(n,e)&&On(i,e);for(;r.length>o;)wn(n,e=r[o++])&&(~An(i,e)||On(i,e));return i},Ln=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","toString","valueOf"],En=Tn,In=Ln.concat("length","prototype");$e.f=Object.getOwnPropertyNames||function(t){return En(t,In)};var Rn={};Rn.f=Object.getOwnPropertySymbols;var Mn=H,jn=$e,xn=Rn,Pn=Fr,_n=T([].concat),Fn=Mn("Reflect","ownKeys")||function(t){var r=jn.f(Pn(t)),e=xn.f;return e?_n(r,e(t)):r},Cn=Gt,Un=Fn,Dn=a,Vn=Mr,Bn=function(t,r,e){for(var n=Un(r),o=Vn.f,i=Dn.f,a=0;a<n.length;a++){var u=n[a];Cn(t,u)||e&&Cn(e,u)||o(t,u,i(r,u))}},Nn=u,kn=G,Gn=/#|\.prototype\./,Wn=function(t,r){var e=zn[Yn(t)];return e===Hn||e!==qn&&(kn(r)?Nn(r):!!r)},Yn=Wn.normalize=function(t){return String(t).replace(Gn,".").toLowerCase()},zn=Wn.data={},qn=Wn.NATIVE="N",Hn=Wn.POLYFILL="P",Qn=Wn,Xn=i,Zn=a.f,Jn=Qr,Kn=Ke,$n=Mt,to=Bn,ro=Qn,eo=function(t,r){var e,n,o,i,a,u=t.target,c=t.global,s=t.stat;if(e=c?Xn:s?Xn[u]||$n(u,{}):Xn[u]&&Xn[u].prototype)for(n in r){if(i=r[n],o=t.dontCallGetSet?(a=Zn(e,n))&&a.value:e[n],!ro(c?n:u+(s?".":"#")+n,t.forced)&&void 0!==o){if(typeof i==typeof o)continue;to(i,o)}(t.sham||o&&o.sham)&&Jn(i,"sham",!0),Kn(e,n,i,t)}},no=er("iterator"),oo=!1;try{var io=0,ao={next:function(){return{done:!!io++}},return:function(){oo=!0}};ao[no]=function(){return this},Array.from(ao,(function(){throw 2}))}catch(t){}var uo="undefined"!=typeof ArrayBuffer&&"undefined"!=typeof DataView,co={};co[er("toStringTag")]="z";var so,fo,lo,ho="[object z]"===String(co),yo=G,po=R,go=er("toStringTag"),vo=Object,bo="Arguments"===po(function(){return arguments}()),wo=ho?po:function(t){var r,e,n;return void 0===t?"Undefined":null===t?"Null":"string"==typeof(e=function(t,r){try{return t[r]}catch(t){}}(r=vo(t),go))?e:bo?po(r):"Object"===(n=po(r))&&yo(r.callee)?"Arguments":n},mo=He,Ao=Mr,So=function(t,r,e){return e.get&&mo(e.get,r,{getter:!0}),e.set&&mo(e.set,r,{setter:!0}),Ao.f(t,r,e)},Oo=!u((function(){function t(){}return t.prototype.constructor=null,Object.getPrototypeOf(new t)!==t.prototype})),To=Gt,Lo=G,Eo=Bt,Io=Oo,Ro=pe("IE_PROTO"),Mo=Object,jo=Mo.prototype,xo=Io?Mo.getPrototypeOf:function(t){var r=Eo(t);if(To(r,Ro))return r[Ro];var e=r.constructor;return Lo(e)&&r instanceof e?e.prototype:r instanceof Mo?jo:null},Po=T,_o=bt,Fo=Y,Co=function(t){return Fo(t)||null===t},Uo=String,Do=TypeError,Vo=function(t,r,e){try{return Po(_o(Object.getOwnPropertyDescriptor(t,r)[e]))}catch(t){}},Bo=Y,No=D,ko=function(t){if(Co(t))return t;throw new Do("Can't set "+Uo(t)+" as a prototype")},Go=Object.setPrototypeOf||("__proto__"in{}?function(){var t,r=!1,e={};try{(t=Vo(Object.prototype,"__proto__","set"))(e,[]),r=e instanceof Array}catch(t){}return function(e,n){return No(e),ko(n),Bo(e)?(r?t(e,n):e.__proto__=n,e):e}}():void 0),Wo=uo,Yo=c,zo=i,qo=G,Ho=Y,Qo=Gt,Xo=wo,Zo=pt,Jo=Qr,Ko=Ke,$o=So,ti=Q,ri=xo,ei=Go,ni=er,oi=Ht,ii=Me.enforce,ai=Me.get,ui=zo.Int8Array,ci=ui&&ui.prototype,si=zo.Uint8ClampedArray,fi=si&&si.prototype,li=ui&&ri(ui),hi=ci&&ri(ci),yi=Object.prototype,pi=zo.TypeError,gi=ni("toStringTag"),vi=oi("TYPED_ARRAY_TAG"),di="TypedArrayConstructor",bi=Wo&&!!ei&&"Opera"!==Xo(zo.opera),wi=!1,mi={Int8Array:1,Uint8Array:1,Uint8ClampedArray:1,Int16Array:2,Uint16Array:2,Int32Array:4,Uint32Array:4,Float32Array:4,Float64Array:8},Ai={BigInt64Array:8,BigUint64Array:8},Si=function(t){var r=ri(t);if(Ho(r)){var e=ai(r);return e&&Qo(e,di)?e[di]:Si(r)}},Oi=function(t){if(!Ho(t))return!1;var r=Xo(t);return Qo(mi,r)||Qo(Ai,r)};for(so in mi)(lo=(fo=zo[so])&&fo.prototype)?ii(lo)[di]=fo:bi=!1;for(so in Ai)(lo=(fo=zo[so])&&fo.prototype)&&(ii(lo)[di]=fo);if((!bi||!qo(li)||li===Function.prototype)&&(li=function(){throw new pi("Incorrect invocation")},bi))for(so in mi)zo[so]&&ei(zo[so],li);if((!bi||!hi||hi===yi)&&(hi=li.prototype,bi))for(so in mi)zo[so]&&ei(zo[so].prototype,hi);if(bi&&ri(fi)!==hi&&ei(fi,hi),Yo&&!Qo(hi,gi))for(so in wi=!0,$o(hi,gi,{configurable:!0,get:function(){return Ho(this)?this[vi]:void 0}}),mi)zo[so]&&Jo(zo[so],vi,so);var Ti={NATIVE_ARRAY_BUFFER_VIEWS:bi,TYPED_ARRAY_TAG:wi&&vi,aTypedArray:function(t){if(Oi(t))return t;throw new pi("Target is not a typed array")},aTypedArrayConstructor:function(t){if(qo(t)&&(!ei||ti(li,t)))return t;throw new pi(Zo(t)+" is not a typed array constructor")},exportTypedArrayMethod:function(t,r,e,n){if(Yo){if(e)for(var o in mi){var i=zo[o];if(i&&Qo(i.prototype,t))try{delete i.prototype[t]}catch(e){try{i.prototype[t]=r}catch(t){}}}hi[t]&&!e||Ko(hi,t,e?r:bi&&ci[t]||r,n)}},exportTypedArrayStaticMethod:function(t,r,e){var n,o;if(Yo){if(ei){if(e)for(n in mi)if((o=zo[n])&&Qo(o,t))try{delete o[t]}catch(t){}if(li[t]&&!e)return;try{return Ko(li,t,e?r:bi&&li[t]||r)}catch(t){}}for(n in mi)!(o=zo[n])||o[t]&&!e||Ko(o,t,r)}},getTypedArrayConstructor:Si,isView:function(t){if(!Ho(t))return!1;var r=Xo(t);return"DataView"===r||Qo(mi,r)||Qo(Ai,r)},isTypedArray:Oi,TypedArray:li,TypedArrayPrototype:hi},Li=i,Ei=u,Ii=function(t,r){try{if(!r&&!oo)return!1}catch(t){return!1}var e=!1;try{var n={};n[no]=function(){return{next:function(){return{done:e=!0}}}},t(n)}catch(t){}return e},Ri=Ti.NATIVE_ARRAY_BUFFER_VIEWS,Mi=Li.ArrayBuffer,ji=Li.Int8Array,xi=!Ri||!Ei((function(){ji(1)}))||!Ei((function(){new ji(-1)}))||!Ii((function(t){new ji,new ji(null),new ji(1.5),new ji(t)}),!0)||Ei((function(){return 1!==new ji(new Mi(2),1,void 0).length})),Pi=Ke,_i=Q,Fi=TypeError,Ci=function(t,r){if(_i(r,t))return t;throw new Fi("Incorrect invocation")},Ui=nn,Di=ln,Vi=RangeError,Bi=function(t){if(void 0===t)return 0;var r=Ui(t),e=Di(r);if(r!==e)throw new Vi("Wrong length or index");return e},Ni=Math.sign||function(t){var r=+t;return 0===r||r!=r?r:r<0?-1:1},ki=Math.abs,Gi=2220446049250313e-31,Wi=1/Gi,Yi=function(t,r,e,n){var o=+t,i=ki(o),a=Ni(o);if(i<n)return a*function(t){return t+Wi-Wi}(i/n/r)*n*r;var u=(1+r/Gi)*i,c=u-(u-i);return c>e||c!=c?a*(1/0):a*c},zi=Math.fround||function(t){return Yi(t,1.1920928955078125e-7,34028234663852886e22,11754943508222875e-54)},qi=Array,Hi=Math.abs,Qi=Math.pow,Xi=Math.floor,Zi=Math.log,Ji=Math.LN2,Ki={pack:function(t,r,e){var n,o,i,a=qi(e),u=8*e-r-1,c=(1<<u)-1,s=c>>1,f=23===r?Qi(2,-24)-Qi(2,-77):0,l=t<0||0===t&&1/t<0?1:0,h=0;for((t=Hi(t))!=t||t===1/0?(o=t!=t?1:0,n=c):(n=Xi(Zi(t)/Ji),t*(i=Qi(2,-n))<1&&(n--,i*=2),(t+=n+s>=1?f/i:f*Qi(2,1-s))*i>=2&&(n++,i/=2),n+s>=c?(o=0,n=c):n+s>=1?(o=(t*i-1)*Qi(2,r),n+=s):(o=t*Qi(2,s-1)*Qi(2,r),n=0));r>=8;)a[h++]=255&o,o/=256,r-=8;for(n=n<<r|o,u+=r;u>0;)a[h++]=255&n,n/=256,u-=8;return a[--h]|=128*l,a},unpack:function(t,r){var e,n=t.length,o=8*n-r-1,i=(1<<o)-1,a=i>>1,u=o-7,c=n-1,s=t[c--],f=127&s;for(s>>=7;u>0;)f=256*f+t[c--],u-=8;for(e=f&(1<<-u)-1,f>>=-u,u+=r;u>0;)e=256*e+t[c--],u-=8;if(0===f)f=1-a;else{if(f===i)return e?NaN:s?-1/0:1/0;e+=Qi(2,r),f-=a}return(s?-1:1)*e*Qi(2,f-r)}},$i=Bt,ta=cn,ra=yn,ea=function(t){for(var r=$i(this),e=ra(r),n=arguments.length,o=ta(n>1?arguments[1]:void 0,e),i=n>2?arguments[2]:void 0,a=void 0===i?e:ta(i,e);a>o;)r[o++]=t;return r},na=T([].slice),oa=G,ia=Y,aa=Go,ua=function(t,r,e){var n,o;return aa&&oa(n=r.constructor)&&n!==e&&ia(o=n.prototype)&&o!==e.prototype&&aa(t,o),t},ca=Mr.f,sa=Gt,fa=er("toStringTag"),la=function(t,r,e){t&&!e&&(t=t.prototype),t&&!sa(t,fa)&&ca(t,fa,{configurable:!0,value:r})},ha=i,ya=T,pa=c,ga=uo,va=Qr,da=So,ba=function(t,r,e){for(var n in r)Pi(t,n,r[n],e);return t},wa=u,ma=Ci,Aa=nn,Sa=ln,Oa=Bi,Ta=zi,La=Ki,Ea=xo,Ia=Go,Ra=ea,Ma=na,ja=ua,xa=Bn,Pa=la,_a=Me,Fa=re.PROPER,Ca=re.CONFIGURABLE,Ua="ArrayBuffer",Da="DataView",Va="prototype",Ba="Wrong index",Na=_a.getterFor(Ua),ka=_a.getterFor(Da),Ga=_a.set,Wa=ha[Ua],Ya=Wa,za=Ya&&Ya[Va],qa=ha[Da],Ha=qa&&qa[Va],Qa=Object.prototype,Xa=ha.Array,Za=ha.RangeError,Ja=ya(Ra),Ka=ya([].reverse),$a=La.pack,tu=La.unpack,ru=function(t){return[255&t]},eu=function(t){return[255&t,t>>8&255]},nu=function(t){return[255&t,t>>8&255,t>>16&255,t>>24&255]},ou=function(t){return t[3]<<24|t[2]<<16|t[1]<<8|t[0]},iu=function(t){return $a(Ta(t),23,4)},au=function(t){return $a(t,52,8)},uu=function(t,r,e){da(t[Va],r,{configurable:!0,get:function(){return e(this)[r]}})},cu=function(t,r,e,n){var o=ka(t),i=Oa(e),a=!!n;if(i+r>o.byteLength)throw new Za(Ba);var u=o.bytes,c=i+o.byteOffset,s=Ma(u,c,c+r);return a?s:Ka(s)},su=function(t,r,e,n,o,i){var a=ka(t),u=Oa(e),c=n(+o),s=!!i;if(u+r>a.byteLength)throw new Za(Ba);for(var f=a.bytes,l=u+a.byteOffset,h=0;h<r;h++)f[l+h]=c[s?h:r-h-1]};if(ga){var fu=Fa&&Wa.name!==Ua;wa((function(){Wa(1)}))&&wa((function(){new Wa(-1)}))&&!wa((function(){return new Wa,new Wa(1.5),new Wa(NaN),1!==Wa.length||fu&&!Ca}))?fu&&Ca&&va(Wa,"name",Ua):((Ya=function(t){return ma(this,za),ja(new Wa(Oa(t)),this,Ya)})[Va]=za,za.constructor=Ya,xa(Ya,Wa)),Ia&&Ea(Ha)!==Qa&&Ia(Ha,Qa);var lu=new qa(new Ya(2)),hu=ya(Ha.setInt8);lu.setInt8(0,2147483648),lu.setInt8(1,2147483649),!lu.getInt8(0)&&lu.getInt8(1)||ba(Ha,{setInt8:function(t,r){hu(this,t,r<<24>>24)},setUint8:function(t,r){hu(this,t,r<<24>>24)}},{unsafe:!0})}else za=(Ya=function(t){ma(this,za);var r=Oa(t);Ga(this,{type:Ua,bytes:Ja(Xa(r),0),byteLength:r}),pa||(this.byteLength=r,this.detached=!1)})[Va],Ha=(qa=function(t,r,e){ma(this,Ha),ma(t,za);var n=Na(t),o=n.byteLength,i=Aa(r);if(i<0||i>o)throw new Za("Wrong offset");if(i+(e=void 0===e?o-i:Sa(e))>o)throw new Za("Wrong length");Ga(this,{type:Da,buffer:t,byteLength:e,byteOffset:i,bytes:n.bytes}),pa||(this.buffer=t,this.byteLength=e,this.byteOffset=i)})[Va],pa&&(uu(Ya,"byteLength",Na),uu(qa,"buffer",ka),uu(qa,"byteLength",ka),uu(qa,"byteOffset",ka)),ba(Ha,{getInt8:function(t){return cu(this,1,t)[0]<<24>>24},getUint8:function(t){return cu(this,1,t)[0]},getInt16:function(t){var r=cu(this,2,t,arguments.length>1&&arguments[1]);return(r[1]<<8|r[0])<<16>>16},getUint16:function(t){var r=cu(this,2,t,arguments.length>1&&arguments[1]);return r[1]<<8|r[0]},getInt32:function(t){return ou(cu(this,4,t,arguments.length>1&&arguments[1]))},getUint32:function(t){return ou(cu(this,4,t,arguments.length>1&&arguments[1]))>>>0},getFloat32:function(t){return tu(cu(this,4,t,arguments.length>1&&arguments[1]),23)},getFloat64:function(t){return tu(cu(this,8,t,arguments.length>1&&arguments[1]),52)},setInt8:function(t,r){su(this,1,t,ru,r)},setUint8:function(t,r){su(this,1,t,ru,r)},setInt16:function(t,r){su(this,2,t,eu,r,arguments.length>2&&arguments[2])},setUint16:function(t,r){su(this,2,t,eu,r,arguments.length>2&&arguments[2])},setInt32:function(t,r){su(this,4,t,nu,r,arguments.length>2&&arguments[2])},setUint32:function(t,r){su(this,4,t,nu,r,arguments.length>2&&arguments[2])},setFloat32:function(t,r){su(this,4,t,iu,r,arguments.length>2&&arguments[2])},setFloat64:function(t,r){su(this,8,t,au,r,arguments.length>2&&arguments[2])}});Pa(Ya,Ua),Pa(qa,Da);var yu={ArrayBuffer:Ya,DataView:qa},pu=Y,gu=Math.floor,vu=Number.isInteger||function(t){return!pu(t)&&isFinite(t)&&gu(t)===t},du=nn,bu=RangeError,wu=function(t){var r=du(t);if(r<0)throw new bu("The argument can't be less than 0");return r},mu=RangeError,Au=function(t,r){var e=wu(t);if(e%r)throw new mu("Wrong offset");return e},Su=Math.round,Ou={},Tu=Tn,Lu=Ln,Eu=Object.keys||function(t){return Tu(t,Lu)},Iu=c,Ru=jr,Mu=Mr,ju=Fr,xu=N,Pu=Eu;Ou.f=Iu&&!Ru?Object.defineProperties:function(t,r){ju(t);for(var e,n=xu(r),o=Pu(r),i=o.length,a=0;i>a;)Mu.f(t,e=o[a++],n[e]);return t};var _u,Fu=H("document","documentElement"),Cu=Fr,Uu=Ou,Du=Ln,Vu=ge,Bu=Fu,Nu=dr,ku="prototype",Gu="script",Wu=pe("IE_PROTO"),Yu=function(){},zu=function(t){return"<"+Gu+">"+t+"</"+Gu+">"},qu=function(t){t.write(zu("")),t.close();var r=t.parentWindow.Object;return t=null,r},Hu=function(){try{_u=new ActiveXObject("htmlfile")}catch(t){}var t,r,e;Hu="undefined"!=typeof document?document.domain&&_u?qu(_u):(r=Nu("iframe"),e="java"+Gu+":",r.style.display="none",Bu.appendChild(r),r.src=String(e),(t=r.contentWindow.document).open(),t.write(zu("document.F=Object")),t.close(),t.F):qu(_u);for(var n=Du.length;n--;)delete Hu[ku][Du[n]];return Hu()};Vu[Wu]=!0;var Qu=Object.create||function(t,r){var e;return null!==t?(Yu[ku]=Cu(t),e=new Yu,Yu[ku]=null,e[Wu]=t):e=Hu(),void 0===r?e:Uu.f(e,r)},Xu=R,Zu=T,Ju=function(t){if("Function"===Xu(t))return Zu(t)},Ku=bt,$u=s,tc=Ju(Ju.bind),rc=function(t,r){return Ku(t),void 0===r?t:$u?tc(t,r):function(){return t.apply(r,arguments)}},ec=T,nc=u,oc=G,ic=wo,ac=ce,uc=function(){},cc=H("Reflect","construct"),sc=/^\s*(?:class|function)\b/,fc=ec(sc.exec),lc=!sc.test(uc),hc=function(t){if(!oc(t))return!1;try{return cc(uc,[],t),!0}catch(t){return!1}},yc=function(t){if(!oc(t))return!1;switch(ic(t)){case"AsyncFunction":case"GeneratorFunction":case"AsyncGeneratorFunction":return!1}try{return lc||!!fc(sc,ac(t))}catch(t){return!0}};yc.sham=!0;var pc=!cc||nc((function(){var t;return hc(hc.call)||!hc(Object)||!hc((function(){t=!0}))||t}))?yc:hc,gc=pc,vc=pt,dc=TypeError,bc={},wc=wo,mc=At,Ac=F,Sc=bc,Oc=er("iterator"),Tc=function(t){if(!Ac(t))return mc(t,Oc)||mc(t,"@@iterator")||Sc[wc(t)]},Lc=h,Ec=bt,Ic=Fr,Rc=pt,Mc=Tc,jc=TypeError,xc=bc,Pc=er("iterator"),_c=Array.prototype,Fc=wo,Cc=fr,Uc=TypeError,Dc=function(t){var r=Cc(t,"number");if("number"==typeof r)throw new Uc("Can't convert number to bigint");return BigInt(r)},Vc=rc,Bc=h,Nc=function(t){if(gc(t))return t;throw new dc(vc(t)+" is not a constructor")},kc=Bt,Gc=yn,Wc=function(t,r){var e=arguments.length<2?Mc(t):r;if(Ec(e))return Ic(Lc(e,t));throw new jc(Rc(t)+" is not iterable")},Yc=Tc,zc=function(t){return void 0!==t&&(xc.Array===t||_c[Pc]===t)},qc=function(t){var r=Fc(t);return"BigInt64Array"===r||"BigUint64Array"===r},Hc=Ti.aTypedArrayConstructor,Qc=Dc,Xc=R,Zc=Array.isArray||function(t){return"Array"===Xc(t)},Jc=pc,Kc=Y,$c=er("species"),ts=Array,rs=function(t){var r;return Zc(t)&&(r=t.constructor,(Jc(r)&&(r===ts||Zc(r.prototype))||Kc(r)&&null===(r=r[$c]))&&(r=void 0)),void 0===r?ts:r},es=rc,ns=_,os=Bt,is=yn,as=function(t,r){return new(rs(t))(0===r?0:r)},us=T([].push),cs=function(t){var r=1===t,e=2===t,n=3===t,o=4===t,i=6===t,a=7===t,u=5===t||i;return function(c,s,f,l){for(var h,y,p=os(c),g=ns(p),v=is(g),d=es(s,f),b=0,w=l||as,m=r?w(c,v):e||a?w(c,0):void 0;v>b;b++)if((u||b in g)&&(y=d(h=g[b],b,p),t))if(r)m[b]=y;else if(y)switch(t){case 3:return!0;case 5:return h;case 6:return b;case 2:us(m,h)}else switch(t){case 4:return!1;case 7:us(m,h)}return i?-1:n||o?o:m}},ss={forEach:cs(0),map:cs(1),filter:cs(2),some:cs(3),every:cs(4),find:cs(5),findIndex:cs(6),filterReject:cs(7)},fs=H,ls=So,hs=c,ys=er("species"),ps=yn,gs=eo,vs=i,ds=h,bs=c,ws=xi,ms=Ti,As=yu,Ss=Ci,Os=w,Ts=Qr,Ls=vu,Es=ln,Is=Bi,Rs=Au,Ms=function(t){var r=Su(t);return r<0?0:r>255?255:255&r},js=yr,xs=Gt,Ps=wo,_s=Y,Fs=ht,Cs=Qu,Us=Q,Ds=Go,Vs=$e.f,Bs=function(t){var r,e,n,o,i,a,u,c,s=Nc(this),f=kc(t),l=arguments.length,h=l>1?arguments[1]:void 0,y=void 0!==h,p=Yc(f);if(p&&!zc(p))for(c=(u=Wc(f,p)).next,f=[];!(a=Bc(c,u)).done;)f.push(a.value);for(y&&l>2&&(h=Vc(h,arguments[2])),e=Gc(f),n=new(Hc(s))(e),o=qc(n),r=0;e>r;r++)i=y?h(f[r],r):f[r],n[r]=o?Qc(i):+i;return n},Ns=ss.forEach,ks=function(t){var r=fs(t);hs&&r&&!r[ys]&&ls(r,ys,{configurable:!0,get:function(){return this}})},Gs=So,Ws=Mr,Ys=a,zs=function(t,r,e){for(var n=0,o=arguments.length>2?e:ps(r),i=new t(o);o>n;)i[n]=r[n++];return i},qs=ua,Hs=Me.get,Qs=Me.set,Xs=Me.enforce,Zs=Ws.f,Js=Ys.f,Ks=vs.RangeError,$s=As.ArrayBuffer,tf=$s.prototype,rf=As.DataView,ef=ms.NATIVE_ARRAY_BUFFER_VIEWS,nf=ms.TYPED_ARRAY_TAG,of=ms.TypedArray,af=ms.TypedArrayPrototype,uf=ms.isTypedArray,cf="BYTES_PER_ELEMENT",sf="Wrong length",ff=function(t,r){Gs(t,r,{configurable:!0,get:function(){return Hs(this)[r]}})},lf=function(t){var r;return Us(tf,t)||"ArrayBuffer"===(r=Ps(t))||"SharedArrayBuffer"===r},hf=function(t,r){return uf(t)&&!Fs(r)&&r in t&&Ls(+r)&&r>=0},yf=function(t,r){return r=js(r),hf(t,r)?Os(2,t[r]):Js(t,r)},pf=function(t,r,e){return r=js(r),!(hf(t,r)&&_s(e)&&xs(e,"value"))||xs(e,"get")||xs(e,"set")||e.configurable||xs(e,"writable")&&!e.writable||xs(e,"enumerable")&&!e.enumerable?Zs(t,r,e):(t[r]=e.value,t)};bs?(ef||(Ys.f=yf,Ws.f=pf,ff(af,"buffer"),ff(af,"byteOffset"),ff(af,"byteLength"),ff(af,"length")),gs({target:"Object",stat:!0,forced:!ef},{getOwnPropertyDescriptor:yf,defineProperty:pf}),n.exports=function(t,r,e){var n=t.match(/\d+/)[0]/8,o=t+(e?"Clamped":"")+"Array",i="get"+t,a="set"+t,u=vs[o],c=u,s=c&&c.prototype,f={},l=function(t,r){Zs(t,r,{get:function(){return function(t,r){var e=Hs(t);return e.view[i](r*n+e.byteOffset,!0)}(this,r)},set:function(t){return function(t,r,o){var i=Hs(t);i.view[a](r*n+i.byteOffset,e?Ms(o):o,!0)}(this,r,t)},enumerable:!0})};ef?ws&&(c=r((function(t,r,e,o){return Ss(t,s),qs(_s(r)?lf(r)?void 0!==o?new u(r,Rs(e,n),o):void 0!==e?new u(r,Rs(e,n)):new u(r):uf(r)?zs(c,r):ds(Bs,c,r):new u(Is(r)),t,c)})),Ds&&Ds(c,of),Ns(Vs(u),(function(t){t in c||Ts(c,t,u[t])})),c.prototype=s):(c=r((function(t,r,e,o){Ss(t,s);var i,a,u,f=0,h=0;if(_s(r)){if(!lf(r))return uf(r)?zs(c,r):ds(Bs,c,r);i=r,h=Rs(e,n);var y=r.byteLength;if(void 0===o){if(y%n)throw new Ks(sf);if((a=y-h)<0)throw new Ks(sf)}else if((a=Es(o)*n)+h>y)throw new Ks(sf);u=a/n}else u=Is(r),i=new $s(a=u*n);for(Qs(t,{buffer:i,byteOffset:h,byteLength:a,length:u,view:new rf(i)});f<u;)l(t,f++)})),Ds&&Ds(c,of),s=c.prototype=Cs(af)),s.constructor!==c&&Ts(s,"constructor",c),Xs(s).TypedArrayConstructor=c,nf&&Ts(s,nf,o);var h=c!==u;f[o]=c,gs({global:!0,constructor:!0,forced:h,sham:!ef},f),cf in c||Ts(c,cf,n),cf in s||Ts(s,cf,n),ks(o)}):n.exports=function(){},(0,n.exports)("Float32",(function(t){return function(r,e,n){return t(this,r,e,n)}}));var gf=ea,vf=Dc,df=wo,bf=h,wf=u,mf=Ti.aTypedArray,Af=Ti.exportTypedArrayMethod,Sf=T("".slice);Af("fill",(function(t){var r=arguments.length;mf(this);var e="Big"===Sf(df(this),0,3)?vf(t):+t;return bf(gf,this,e,r>1?arguments[1]:void 0,r>2?arguments[2]:void 0)}),wf((function(){var t=0;return new Int8Array(2).fill({valueOf:function(){return t++}}),1!==t})));var Of=i,Tf=h,Lf=Ti,Ef=yn,If=Au,Rf=Bt,Mf=u,jf=Of.RangeError,xf=Of.Int8Array,Pf=xf&&xf.prototype,_f=Pf&&Pf.set,Ff=Lf.aTypedArray,Cf=Lf.exportTypedArrayMethod,Uf=!Mf((function(){var t=new Uint8ClampedArray(2);return Tf(_f,t,{length:1,0:3},1),3!==t[1]})),Df=Uf&&Lf.NATIVE_ARRAY_BUFFER_VIEWS&&Mf((function(){var t=new xf(2);return t.set(1),t.set("2",1),0!==t[0]||2!==t[1]}));Cf("set",(function(t){Ff(this);var r=If(arguments.length>1?arguments[1]:void 0,1),e=Rf(t);if(Uf)return Tf(_f,this,e,r);var n=this.length,o=Ef(e),i=0;if(o+r>n)throw new jf("Wrong length");for(;i<o;)this[r+i]=e[i++]}),!Uf||Df);var Vf=na,Bf=Math.floor,Nf=function(t,r){var e=t.length;if(e<8)for(var n,o,i=1;i<e;){for(o=i,n=t[i];o&&r(t[o-1],n)>0;)t[o]=t[--o];o!==i++&&(t[o]=n)}else for(var a=Bf(e/2),u=Nf(Vf(t,0,a),r),c=Nf(Vf(t,a),r),s=u.length,f=c.length,l=0,h=0;l<s||h<f;)t[l+h]=l<s&&h<f?r(u[l],c[h])<=0?u[l++]:c[h++]:l<s?u[l++]:c[h++];return t},kf=Nf,Gf=X.match(/firefox\/(\d+)/i),Wf=!!Gf&&+Gf[1],Yf=/MSIE|Trident/.test(X),zf=X.match(/AppleWebKit\/(\d+)\./),qf=!!zf&&+zf[1],Hf=Ju,Qf=u,Xf=bt,Zf=kf,Jf=Wf,Kf=Yf,$f=et,tl=qf,rl=Ti.aTypedArray,el=Ti.exportTypedArrayMethod,nl=i.Uint16Array,ol=nl&&Hf(nl.prototype.sort),il=!(!ol||Qf((function(){ol(new nl(2),null)}))&&Qf((function(){ol(new nl(2),{})}))),al=!!ol&&!Qf((function(){if($f)return $f<74;if(Jf)return Jf<67;if(Kf)return!0;if(tl)return tl<602;var t,r,e=new nl(516),n=Array(516);for(t=0;t<516;t++)r=t%4,e[t]=515-t,n[t]=t-2*r+3;for(ol(e,(function(t,r){return(t/4|0)-(r/4|0)})),t=0;t<516;t++)if(e[t]!==n[t])return!0}));el("sort",(function(t){return void 0!==t&&Xf(t),al?ol(this,t):Zf(rl(this),function(t){return function(r,e){return void 0!==t?+t(r,e)||0:e!=e?-1:r!=r?1:0===r&&0===e?1/r>0&&1/e<0?1:-1:r>e}}(t))}),!al||il);var ul=dr("span").classList,cl=ul&&ul.constructor&&ul.constructor.prototype,sl=cl===Object.prototype?void 0:cl,fl=er,ll=Qu,hl=Mr.f,yl=fl("unscopables"),pl=Array.prototype;void 0===pl[yl]&&hl(pl,yl,{configurable:!0,value:ll(null)});var gl,vl,dl,bl=u,wl=G,ml=Y,Al=xo,Sl=Ke,Ol=er("iterator"),Tl=!1;[].keys&&("next"in(dl=[].keys())?(vl=Al(Al(dl)))!==Object.prototype&&(gl=vl):Tl=!0);var Ll=!ml(gl)||bl((function(){var t={};return gl[Ol].call(t)!==t}));Ll&&(gl={}),wl(gl[Ol])||Sl(gl,Ol,(function(){return this}));var El={IteratorPrototype:gl,BUGGY_SAFARI_ITERATORS:Tl},Il=El.IteratorPrototype,Rl=Qu,Ml=w,jl=la,xl=bc,Pl=function(){return this},_l=eo,Fl=h,Cl=G,Ul=function(t,r,e,n){var o=r+" Iterator";return t.prototype=Rl(Il,{next:Ml(+!n,e)}),jl(t,o,!1),xl[o]=Pl,t},Dl=xo,Vl=Go,Bl=la,Nl=Qr,kl=Ke,Gl=bc,Wl=re.PROPER,Yl=re.CONFIGURABLE,zl=El.IteratorPrototype,ql=El.BUGGY_SAFARI_ITERATORS,Hl=er("iterator"),Ql="keys",Xl="values",Zl="entries",Jl=function(){return this},Kl=N,$l=function(t){pl[yl][t]=!0},th=bc,rh=Me,eh=Mr.f,nh=function(t,r,e,n,o,i,a){Ul(e,r,n);var u,c,s,f=function(t){if(t===o&&g)return g;if(!ql&&t&&t in y)return y[t];switch(t){case Ql:case Xl:case Zl:return function(){return new e(this,t)}}return function(){return new e(this)}},l=r+" Iterator",h=!1,y=t.prototype,p=y[Hl]||y["@@iterator"]||o&&y[o],g=!ql&&p||f(o),v="Array"===r&&y.entries||p;if(v&&(u=Dl(v.call(new t)))!==Object.prototype&&u.next&&(Dl(u)!==zl&&(Vl?Vl(u,zl):Cl(u[Hl])||kl(u,Hl,Jl)),Bl(u,l,!0)),Wl&&o===Xl&&p&&p.name!==Xl&&(Yl?Nl(y,"name",Xl):(h=!0,g=function(){return Fl(p,this)})),o)if(c={values:f(Xl),keys:i?g:f(Ql),entries:f(Zl)},a)for(s in c)(ql||h||!(s in y))&&kl(y,s,c[s]);else _l({target:r,proto:!0,forced:ql||h},c);return y[Hl]!==g&&kl(y,Hl,g,{name:o}),Gl[r]=g,c},oh=function(t,r){return{value:t,done:r}},ih=c,ah="Array Iterator",uh=rh.set,ch=rh.getterFor(ah),sh=nh(Array,"Array",(function(t,r){uh(this,{type:ah,target:Kl(t),index:0,kind:r})}),(function(){var t=ch(this),r=t.target,e=t.index++;if(!r||e>=r.length)return t.target=void 0,oh(void 0,!0);switch(t.kind){case"keys":return oh(e,!1);case"values":return oh(r[e],!1)}return oh([e,r[e]],!1)}),"values"),fh=th.Arguments=th.Array;if($l("keys"),$l("values"),$l("entries"),ih&&"values"!==fh.name)try{eh(fh,"name",{value:"values"})}catch(t){}var lh=i,hh={CSSRuleList:0,CSSStyleDeclaration:0,CSSValueList:0,ClientRectList:0,DOMRectList:0,DOMStringList:0,DOMTokenList:1,DataTransferItemList:0,FileList:0,HTMLAllCollection:0,HTMLCollection:0,HTMLFormElement:0,HTMLSelectElement:0,MediaList:0,MimeTypeArray:0,NamedNodeMap:0,NodeList:1,PaintRequestList:0,Plugin:0,PluginArray:0,SVGLengthList:0,SVGNumberList:0,SVGPathSegList:0,SVGPointList:0,SVGStringList:0,SVGTransformList:0,SourceBufferList:0,StyleSheetList:0,TextTrackCueList:0,TextTrackList:0,TouchList:0},yh=sl,ph=sh,gh=Qr,vh=la,dh=er("iterator"),bh=ph.values,wh=function(t,r){if(t){if(t[dh]!==bh)try{gh(t,dh,bh)}catch(r){t[dh]=bh}if(vh(t,r,!0),hh[r])for(var e in ph)if(t[e]!==ph[e])try{gh(t,e,ph[e])}catch(r){t[e]=ph[e]}}};for(var mh in hh)wh(lh[mh]&&lh[mh].prototype,mh);wh(yh,"DOMTokenList");const{atan:Ah,cos:Sh,exp:Oh,log:Th,tan:Lh,PI:Eh}=Math,{degToRad:Ih,radToDeg:Rh}=r.MathUtils,Mh=6371010,jh=Math.PI*Mh;function xh(t){return window.google&&google.maps&&(t instanceof google.maps.LatLng||t instanceof google.maps.LatLngAltitude)?{altitude:0,...t.toJSON()}:{altitude:0,...t}}function Ph(t,e){let n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:new r.Vector3;const[o,i]=_h(t),[a,u]=_h(e);return n.set(o-a,i-u,0),n.multiplyScalar(Sh(Ih(e.lat))),n.z=t.altitude-e.altitude,n}function _h(t){return[Mh*Ih(t.lng),Mh*Th(Lh(.25*Eh+.5*Ih(t.lat)))]}const Fh=new r.Vector3(0,0,1);return t.EARTH_RADIUS=Mh,t.ThreeJSOverlayView=class{constructor(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.animationMode="ondemand",this.rotationArray=new Float32Array(3),this.rotationInverse=new r.Quaternion,this.projectionMatrixInverse=new r.Matrix4,this.raycaster=new r.Raycaster;const{anchor:e={lat:0,lng:0,altitude:0},upAxis:n="Z",scene:o,map:i,animationMode:a="ondemand",addDefaultLighting:u=!0}=t;this.overlay=new google.maps.WebGLOverlayView,this.renderer=null,this.camera=null,this.animationMode=a,this.setAnchor(e),this.setUpAxis(n),this.scene=null!=o?o:new r.Scene,u&&this.initSceneLights(),this.overlay.onAdd=this.onAdd.bind(this),this.overlay.onRemove=this.onRemove.bind(this),this.overlay.onContextLost=this.onContextLost.bind(this),this.overlay.onContextRestored=this.onContextRestored.bind(this),this.overlay.onStateUpdate=this.onStateUpdate.bind(this),this.overlay.onDraw=this.onDraw.bind(this),this.camera=new r.PerspectiveCamera,i&&this.setMap(i)}setAnchor(t){this.anchor=xh(t)}setUpAxis(t){const e=new r.Vector3(0,0,1);"string"!=typeof t?e.copy(t):"y"===t.toLowerCase()?e.set(0,1,0):"z"!==t.toLowerCase()&&console.warn("invalid value '".concat(t,"' specified as upAxis")),e.normalize();const n=new r.Quaternion;n.setFromUnitVectors(e,Fh),this.rotationInverse.copy(n).invert();const o=(new r.Euler).setFromQuaternion(n,"XYZ");this.rotationArray[0]=r.MathUtils.radToDeg(o.x),this.rotationArray[1]=r.MathUtils.radToDeg(o.y),this.rotationArray[2]=r.MathUtils.radToDeg(o.z)}raycast(t,r){let e,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};Array.isArray(r)?e=r||null:(e=[this.scene],n={...r,recursive:!0});const{updateMatrix:o=!0,recursive:i=!1,raycasterParameters:a}=n;o&&this.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert(),this.raycaster.ray.origin.set(t.x,t.y,0).applyMatrix4(this.projectionMatrixInverse),this.raycaster.ray.direction.set(t.x,t.y,.5).applyMatrix4(this.projectionMatrixInverse).sub(this.raycaster.ray.origin).normalize();const u=this.raycaster.params;a&&(this.raycaster.params=a);const c=this.raycaster.intersectObjects(e,i);return this.raycaster.params=u,c}onStateUpdate(){}onAdd(){}onBeforeDraw(){}onRemove(){}requestStateUpdate(){this.overlay.requestStateUpdate()}requestRedraw(){this.overlay.requestRedraw()}getMap(){return this.overlay.getMap()}setMap(t){this.overlay.setMap(t)}addListener(t,r){return this.overlay.addListener(t,r)}onContextRestored(t){let{gl:e}=t;this.renderer=new r.WebGLRenderer({canvas:e.canvas,context:e,...e.getContextAttributes()}),this.renderer.autoClear=!1,this.renderer.autoClearDepth=!1,this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=r.PCFSoftShadowMap,Number(r.REVISION)<152&&(this.renderer.outputEncoding=3001);const{width:n,height:o}=e.canvas;this.renderer.setViewport(0,0,n,o)}onContextLost(){this.renderer&&(this.renderer.dispose(),this.renderer=null)}onDraw(t){let{gl:r,transformer:e}=t;this.camera.projectionMatrix.fromArray(e.fromLatLngAltitude(this.anchor,this.rotationArray)),r.disable(r.SCISSOR_TEST),this.onBeforeDraw(),this.renderer.render(this.scene,this.camera),this.renderer.resetState(),"always"===this.animationMode&&this.requestRedraw()}latLngAltitudeToVector3(t){let e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:new r.Vector3;return Ph(xh(t),this.anchor,e),e.applyQuaternion(this.rotationInverse),e}bindTo(t,r,e,n){this.overlay.bindTo(t,r,e,n)}get(t){return this.overlay.get(t)}notify(t){this.overlay.notify(t)}set(t,r){this.overlay.set(t,r)}setValues(t){this.overlay.setValues(t)}unbind(t){this.overlay.unbind(t)}unbindAll(){this.overlay.unbindAll()}initSceneLights(){const t=new r.HemisphereLight(16777215,4473924,1);t.position.set(0,-.2,1).normalize();const e=new r.DirectionalLight(16777215);e.position.set(0,10,100),this.scene.add(t,e)}},t.WORLD_SIZE=jh,t.latLngToVector3Relative=Ph,t.latLngToXY=_h,t.toLatLngAltitudeLiteral=xh,t.xyToLatLng=function(t){const[r,e]=t;return{lat:Rh(.5*Eh-2*Ah(Oh(-e/Mh))),lng:Rh(r)/Mh}},t}({},THREE);
//# sourceMappingURL=index.dev.js.map
