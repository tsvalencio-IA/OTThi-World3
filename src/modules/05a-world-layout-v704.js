/**
 * OTTHI World V704 — autoridade única do layout mundial.
 * Todas as vias, zonas, estruturas, acessos, destinos e áreas protegidas são
 * definidos aqui para impedir que módulos independentes criem mundos incompatíveis.
 */
// @otthi-module-body
  const WORLD_LAYOUT_V704=Object.freeze({
    version:704,
    bounds:Object.freeze({minX:-190,maxX:190,minZ:-190,maxZ:190}),
    roads:Object.freeze([
      {id:'avenida-central-ns',x:0,z:0,w:18,d:210,kind:'avenue'},
      {id:'avenida-central-ew',x:0,z:0,w:210,d:18,kind:'avenue'},
      {id:'via-floresta-sul',x:-55,z:-55,w:9,d:105,kind:'street'},
      {id:'via-floresta-norte',x:-55,z:28,w:9,d:56,kind:'street'},
      {id:'acesso-construcao-ns',x:-55,z:68,w:9,d:24,kind:'street'},
      {id:'acesso-construcao-ew',x:-35,z:78,w:40,d:7,kind:'street'},
      {id:'via-servicos-leste',x:65,z:-55,w:9,d:105,kind:'street'},
      {id:'via-escola-leste',x:68,z:29,w:9,d:58,kind:'street'},
      {id:'acesso-norte',x:34,z:58,w:68,d:9,kind:'street'},
      {id:'acesso-castelo-fazenda',x:84,z:38,w:32,d:7,kind:'street'},
      {id:'acesso-kart',x:80,z:-65,w:30,d:9,kind:'street'}
    ]),
    highways:Object.freeze([
      Object.freeze({
        id:'ottovias',name:'Rodovia OTTOVIAS',width:12.4,shoulder:1.6,closed:true,
        points:Object.freeze([
          {x:0,z:-108,biome:'city'},{x:20,z:-128,biome:'city'},{x:55,z:-145,biome:'desert'},{x:95,z:-148,biome:'desert'},{x:132,z:-130,biome:'desert'},
          {x:153,z:-98,biome:'desert'},{x:158,z:-55,biome:'field'},{x:158,z:-10,biome:'field'},{x:154,z:38,biome:'field'},{x:142,z:82,biome:'field'},
          {x:112,z:124,biome:'snow'},{x:72,z:150,biome:'snow'},{x:24,z:166,biome:'snow'},{x:-28,z:166,biome:'snow'},{x:-78,z:164,biome:'snow'},
          {x:-126,z:156,biome:'snow'},{x:-156,z:126,biome:'beach'},{x:-168,z:80,biome:'beach'},{x:-170,z:25,biome:'beach'},{x:-168,z:-30,biome:'beach'},
          {x:-150,z:-72,biome:'beach'},{x:-124,z:-108,biome:'country'},{x:-88,z:-132,biome:'country'},{x:-48,z:-145,biome:'country'},{x:-15,z:-130,biome:'city'}
        ]),
        tolls:Object.freeze([
          {id:'ottovias-toll-sul',name:'Praça Sul',routeIndex:2,t:.72,cost:5},
          {id:'ottovias-toll-campo',name:'Praça Campo',routeIndex:7,t:.55,cost:5},
          {id:'ottovias-toll-praia',name:'Praça Praia',routeIndex:18,t:.55,cost:5}
        ])
      }),
      Object.freeze({
        id:'ottovias-urban',name:'OTTOVIAS — Travessia Urbana',width:12.0,shoulder:.9,closed:false,usesExistingRoad:true,
        points:Object.freeze([
          {x:0,z:-108,biome:'city'},{x:0,z:-65,biome:'city'},{x:0,z:-18,biome:'city'},{x:0,z:18,biome:'city'},{x:0,z:58,biome:'city'},{x:0,z:105,biome:'city'}
        ])
      }),
      Object.freeze({
        id:'ottovias-north-connector',name:'OTTOVIAS — Ligação Norte',width:12.4,shoulder:1.6,closed:false,
        points:Object.freeze([
          {x:0,z:105,biome:'city'},{x:0,z:132,biome:'snow'},{x:24,z:166,biome:'snow'}
        ])
      })
    ]),
    nodes:Object.freeze({
      VS:{x:0,z:-105},V65S:{x:0,z:-65},V18S:{x:0,z:-18},C:{x:0,z:0},V18N:{x:0,z:18},V58N:{x:0,z:58},VN:{x:0,z:105},
      HW:{x:-105,z:0},H55W:{x:-55,z:0},H25W:{x:-25,z:0},H25E:{x:25,z:0},H65E:{x:65,z:0},H88E:{x:88,z:0},HE:{x:105,z:0},
      W105S:{x:-55,z:-105},W55S:{x:-55,z:-55},W28N:{x:-55,z:28},W56N:{x:-55,z:56},W80N:{x:-55,z:80},BUILD78:{x:-15,z:78},
      E105S:{x:65,z:-105},E65S:{x:65,z:-65},E18S:{x:65,z:-18},E0:{x:65,z:0},E58N:{x:68,z:58},
      N34:{x:34,z:58},N68:{x:68,z:58},C38:{x:68,z:38},CASTLE38:{x:100,z:38},
      K65:{x:65,z:-65},K80:{x:80,z:-65},K94:{x:94,z:-65},
      OV0:{x:0,z:-108},
      OV1:{x:20,z:-128},
      OV2:{x:55,z:-145},
      OV3:{x:95,z:-148},
      OV4:{x:132,z:-130},
      OV5:{x:153,z:-98},
      OV6:{x:158,z:-55},
      OV7:{x:158,z:-10},
      OV8:{x:154,z:38},
      OV9:{x:142,z:82},
      OV10:{x:112,z:124},
      OV11:{x:72,z:150},
      OV12:{x:24,z:166},
      OV13:{x:-28,z:166},
      OV14:{x:-78,z:164},
      OV15:{x:-126,z:156},
      OV16:{x:-156,z:126},
      OV17:{x:-168,z:80},
      OV18:{x:-170,z:25},
      OV19:{x:-168,z:-30},
      OV20:{x:-150,z:-72},
      OV21:{x:-124,z:-108},
      OV22:{x:-88,z:-132},
      OV23:{x:-48,z:-145},
      OV24:{x:-15,z:-130},OVN1:{x:0,z:132}
    }),
    edges:Object.freeze([
      ['VS','V65S'],['V65S','V18S'],['V18S','C'],['C','V18N'],['V18N','V58N'],['V58N','VN'],
      ['HW','H55W'],['H55W','H25W'],['H25W','C'],['C','H25E'],['H25E','H65E'],['H65E','H88E'],['H88E','HE'],
      ['W105S','W55S'],['W55S','H55W'],['H55W','W28N'],['W28N','W56N'],['W56N','W80N'],['W80N','BUILD78'],
      ['E105S','E65S'],['E65S','E18S'],['E18S','E0'],['E0','H65E'],['E0','C38'],['C38','E58N'],
      ['V58N','N34'],['N34','N68'],['N68','E58N'],['C38','CASTLE38'],
      ['V65S','E65S'],['E65S','K65'],['K65','K80'],['K80','K94'],
      ['VS','OV0'],['VN','OVN1'],['OVN1','OV12'],['OV0','OV1'],['OV1','OV2'],['OV2','OV3'],['OV3','OV4'],['OV4','OV5'],['OV5','OV6'],['OV6','OV7'],['OV7','OV8'],['OV8','OV9'],['OV9','OV10'],['OV10','OV11'],['OV11','OV12'],['OV12','OV13'],['OV13','OV14'],['OV14','OV15'],['OV15','OV16'],['OV16','OV17'],['OV17','OV18'],['OV18','OV19'],['OV19','OV20'],['OV20','OV21'],['OV21','OV22'],['OV22','OV23'],['OV23','OV24'],['OV24','OV0']
    ]),
    points:Object.freeze({
      spawn:{x:-18,z:39},home:{x:-18,z:34},homeGarage:{x:-31,z:46},blue:{x:-30,z:17},pink:{x:24,z:17},shop:{x:-22,z:-18},workshop:{x:22,z:-18},
      school:{x:-68,z:-18},schoolEast:{x:82,z:24},police:{x:78,z:-18},policeWest:{x:-68,z:22},fireStation:{x:96,z:-18},
      well:{x:38,z:10},foundry:{x:43,z:-35},mine:{x:-92,z:-92},cabin:{x:-88,z:-42},
      camp:{x:-78,z:-62},hunt:{x:-101,z:-78},lake:{x:-88,z:54},lakeNorth:{x:-104,z:69},pier:{x:-67,z:54},metroLake:{x:-45,z:56},
      farm:{x:101,z:22},farmEntrance:{x:91,z:34},garage:{x:84,z:30},jobBoard:{x:86,z:34},
      sports:{x:42,z:88},sportsEntrance:{x:42,z:66},footballEntrance:{x:50,z:69},volley:{x:82,z:95},volleyEntrance:{x:82,z:84},footvolley:{x:100,z:95},footvolleyEntrance:{x:100,z:84},
      kart:{x:94,z:-91},kartEntrance:{x:94,z:-70},kartBoxes:{x:94,z:-91},
      castle:{x:100,z:55},castleEntrance:{x:100,z:40},mountain:{x:-88,z:97},mountainEntrance:{x:-62,z:84},
      lava:{x:35,z:-104},giantGate:{x:18,z:-54},miniTunnel:{x:-38,z:34},crouchTunnel:{x:-42,z:24},
      learningMath:{x:22,z:-32},learningPortuguese:{x:22,z:-40},learningEnglish:{x:22,z:-48},learningEntrance:{x:14,z:-40},
      playground:{x:-28,z:-40},fountain:{x:-14,z:-8},portal:{x:82,z:53},
      construction:{x:-33,z:96},constructionEntrance:{x:-33,z:78},
      platformCircuit:{x:94,z:-52},platformEntrance:{x:76,z:-35},
      repairParking:{x:32,z:-18},
      ottoviasEntry:{x:0,z:-108},ottoviasOperations:{x:50,z:-120},ottoviasOperationsAccess:{x:50,z:-109.2},ottoviasMichelle:{x:50,z:-112},
      ottoviasTollSouth:{x:84,z:-147},ottoviasTollField:{x:156,z:16},ottoviasTollBeach:{x:-169,z:-5},
      ottoviasDesert:{x:111,z:-137},ottoviasField:{x:151,z:61},ottoviasSnow:{x:24,z:166},ottoviasBeach:{x:-168,z:80},ottoviasCityCenter:{x:0,z:18},ottoviasCityNorth:{x:0,z:105},
      ottoviasFootbridge:{x:0,z:43}
    }),
    zones:Object.freeze({
      urban:{id:'urban',name:'Centro urbano',x:0,z:0,w:118,d:104},
      residential:{id:'residential',name:'Bairros residenciais',x:-2,z:27,w:92,d:38},
      services:{id:'services',name:'Escolas e serviços',x:78,z:-18,w:70,d:106},
      stadium:{id:'stadium',name:'Estádio e atletismo',x:42,z:88,w:62,d:44},
      courts:{id:'courts',name:'Quadras de vôlei e futevôlei',x:91,z:95,w:34,d:24},
      kart:{id:'kart',name:'Kartódromo',x:94,z:-91,w:44,d:38},
      rural:{id:'rural',name:'Fazenda',x:101,z:22,w:26,d:22},
      lake:{id:'lake',name:'Represa principal',x:-88,z:54,w:50,d:22},
      lakeNorth:{id:'lakeNorth',name:'Enseada norte da represa',x:-104,z:69,w:24,d:14},
      forest:{id:'forest',name:'Floresta e acampamento',x:-86,z:-58,w:60,d:58},
      mine:{id:'mine',name:'Mina',x:-92,z:-92,w:28,d:24},
      castle:{id:'castle',name:'Castelo e aventura',x:100,z:55,w:32,d:28},
      mountain:{id:'mountain',name:'Montanhas e trilhas',x:-88,z:97,w:50,d:36},
      construction:{id:'construction',name:'Construção dos jogadores',x:-33,z:96,w:36,d:32},
      education:{id:'education',name:'Academia Kids',x:22,z:-40,w:18,d:24},
      platform:{id:'platform',name:'Circuito das plataformas',x:94,z:-52,w:38,d:42},
      ottoviasDesert:{id:'ottoviasDesert',name:'OTTOVIAS — trecho Deserto',x:112,z:-135,w:108,d:62},
      ottoviasField:{id:'ottoviasField',name:'OTTOVIAS — trecho Campo',x:151,z:40,w:54,d:142},
      ottoviasSnow:{id:'ottoviasSnow',name:'OTTOVIAS — trecho Neve',x:8,z:164,w:270,d:44},
      ottoviasBeach:{id:'ottoviasBeach',name:'OTTOVIAS — trecho Praia',x:-168,z:32,w:40,d:210}
    }),
    paths:Object.freeze([
      {id:'casa-inicial',x1:-18,z1:37.2,x2:-18,z2:45,w:2.2,destination:'home'},
      {id:'garagem-residencial',x1:-26,z1:46,x2:-10.8,z2:46,w:4.2,destination:'home-garage'},
      {id:'complexo-esportivo',x1:42,z1:62,x2:42,z2:67,w:3.2,destination:'stadium'},
      {id:'entrada-futebol',x1:42,z1:67,x2:50,z2:69,w:2.6,destination:'football-field'},
      {id:'quadras-leste-a',x1:68,z1:62,x2:76,z2:64,w:2.2},
      {id:'quadras-leste-b',x1:76,z1:64,x2:76,z2:82,w:2.2},
      {id:'quadras-leste-conector',x1:76,z1:82,x2:92,z2:82,w:2.2},
      {id:'quadra-volei',x1:76,z1:82,x2:82,z2:84,w:2.2,destination:'volley'},
      {id:'quadra-futevolei',x1:92,z1:82,x2:100,z2:84,w:2.2,destination:'footvolley'},
      {id:'fazenda',x1:91,z1:34,x2:96,z2:30,w:2.2,destination:'farm'},
      {id:'castelo',x1:100,z1:41,x2:100,z2:43,w:5.2,destination:'castle'},
      {id:'kart',x1:94,z1:-69,x2:94,z2:-72.1,w:3.2,destination:'kart-circuit'},
      {id:'montanha',x1:-55,z1:80,x2:-63,z2:84,w:2.2,destination:'mountain'},
      {id:'construcao',x1:-35,z1:81,x2:-33,z2:82,w:3.0,destination:'construction-zone'}
    ]),
    signs:Object.freeze([
      {id:'guide-vila',kind:'guide',text:'Vila do Sol',x:12,z:12,rotationY:0},
      {id:'guide-market',kind:'guide',text:'Mercadinho',x:-22,z:-12,rotationY:0},
      {id:'guide-workshop',kind:'guide',text:'Oficina',x:13.4,z:-11.2,rotationY:0},
      {id:'guide-forest',kind:'guide',text:'Floresta',x:-62,z:-25,rotationY:1.5708},
      {id:'guide-farm',kind:'guide',text:'Fazenda • Garagem',x:82,z:44,rotationY:0},
      {id:'guide-castle',kind:'guide',text:'Castelo',x:106,z:34,rotationY:0},
      {id:'guide-lake',kind:'guide',text:'Represa • Píer',x:-62,z:40,rotationY:1.5708},
      {id:'guide-sports',kind:'guide',text:'Complexo Esportivo',x:42,z:64.6,rotationY:0},
      {id:'guide-kart',kind:'guide',text:'Kartódromo OTTHI',x:94,z:-71.4,rotationY:0},
      {id:'ov-urban-south',kind:'highway',highwayId:'ottovias-urban',segmentIndex:0,t:.52,side:1,offset:3.2,title:'OTTOVIAS',subtitle:'CENTRO • SAÍDA NORTE'},
      {id:'ov-urban-center',kind:'highway',highwayId:'ottovias-urban',segmentIndex:3,t:.48,side:1,offset:3.2,title:'OTTOVIAS',subtitle:'NEVE • PRAIA • PEDÁGIOS'},
      {id:'ov-north',kind:'highway',highwayId:'ottovias-north-connector',segmentIndex:0,t:.56,side:-1,offset:2.5,title:'OTTOVIAS',subtitle:'LIGAÇÃO NORTE • NEVE'},
      {id:'ov-desert',kind:'highway',highwayId:'ottovias',segmentIndex:2,t:.42,side:-1,offset:2.5,title:'DESERTO',subtitle:'PEDÁGIO PRAÇA SUL'},
      {id:'ov-field',kind:'highway',highwayId:'ottovias',segmentIndex:8,t:.55,side:1,offset:2.5,title:'CAMPO',subtitle:'ACESSOS RURAIS'},
      {id:'ov-snow',kind:'highway',highwayId:'ottovias',segmentIndex:12,t:.48,side:1,offset:2.5,title:'NEVE',subtitle:'REDUZA A VELOCIDADE'},
      {id:'ov-beach',kind:'highway',highwayId:'ottovias',segmentIndex:17,t:.52,side:-1,offset:2.5,title:'PRAIA',subtitle:'TRECHO COSTEIRO'}
    ]),
    structures:Object.freeze([
      {id:'home',kind:'house',point:'home',w:9,d:7,margin:1.2,access:'spawn'},
      {id:'home-garage',kind:'garage',point:'homeGarage',w:10,d:10,margin:.8,access:'garagem-residencial'},
      {id:'blue',kind:'house',point:'blue',w:9,d:7,margin:1.2},
      {id:'pink',kind:'house',point:'pink',w:9,d:7,margin:1.2},
      {id:'shop',kind:'house',point:'shop',w:9,d:7,margin:1.2},
      {id:'workshop',kind:'house',point:'workshop',w:15,d:12,margin:.8},
      {id:'school',kind:'house',point:'school',w:9,d:7,margin:1.4},
      {id:'school-east',kind:'house',point:'schoolEast',w:9,d:7,margin:1.4},
      {id:'police',kind:'house',point:'police',w:9,d:7,margin:1.4},
      {id:'police-west',kind:'house',point:'policeWest',w:9,d:7,margin:1.4},
      {id:'fire-station',kind:'house',point:'fireStation',w:9,d:7,margin:1.4},
      {id:'cabin',kind:'house',point:'cabin',w:9,d:7,margin:1.2},
      {id:'stadium',kind:'sport',point:'sports',w:62,d:43,margin:.5},
      {id:'football-field',kind:'sport-inner',point:'sports',w:42,d:18,margin:0,inside:'stadium'},
      {id:'volley',kind:'sport',point:'volley',w:14,d:22,margin:.6},
      {id:'footvolley',kind:'sport',point:'footvolley',w:14,d:22,margin:.6},
      {id:'kart-circuit',kind:'kart',point:'kart',w:44,d:38,margin:.35},
      {id:'kart-boxes',kind:'kart-inner',point:'kartBoxes',w:14,d:32,margin:0,inside:'kart-circuit'},
      {id:'farm',kind:'farm',point:'farm',w:22,d:18,margin:.8},
      {id:'castle',kind:'castle',point:'castle',w:31,d:27.6,margin:.4,allowedRoads:['acesso-castelo-fazenda']},
      {id:'mountain',kind:'terrain',point:'mountain',w:50,d:36,margin:.5},
      {id:'mine',kind:'resource',point:'mine',w:18,d:14,margin:1.0},
      {id:'learning',kind:'education',x:22,z:-40,w:8,d:22,margin:1.0},
      {id:'playground',kind:'playground',point:'playground',w:9,d:7,margin:1.0},
      {id:'giant-gate',kind:'challenge',point:'giantGate',w:10,d:2,margin:1.0},
      {id:'mini-tunnel',kind:'challenge',point:'miniTunnel',w:8,d:6,margin:1.0},
      {id:'crouch-tunnel',kind:'challenge',point:'crouchTunnel',w:8,d:5,margin:1.0},
      {id:'construction-zone',kind:'construction',point:'construction',w:36,d:32,margin:0,allowRoadOverlap:false},
      {id:'ottovias-operations',kind:'transport',point:'ottoviasOperations',w:15,d:9,margin:1.0},
      {id:'metro-lake',kind:'transport',point:'metroLake',w:4.6,d:4.6,margin:.4,allowedRoads:['via-floresta-norte']},
      {id:'ottovias-footbridge',kind:'transport',x:0,z:46,w:28,d:10,margin:.2,allowedRoads:['avenida-central-ns'],allowedHighways:['ottovias-urban']}
    ])
  });
  const OTTHI_PERSONAL_HOME_LOTS=Object.freeze([
    Object.freeze({x:-45,z:32}),Object.freeze({x:-30,z:32}),Object.freeze({x:-18,z:32}),Object.freeze({x:18,z:32}),Object.freeze({x:33,z:32}),
    Object.freeze({x:45,z:32}),Object.freeze({x:-45,z:44}),Object.freeze({x:-18,z:44}),Object.freeze({x:18,z:44}),Object.freeze({x:45,z:44})
  ]);
  function otthiHomeIdentity(){const cloudUid=typeof window!=='undefined'?window.OTTHOS_RTDB?.uid:'';const localState=typeof state!=='undefined'?state:null;return String(cloudUid||localState?.profile?.playerId||localState?.profile?.name||'local-home');}
  function otthiHomeLotIndex(){let hash=2166136261;for(const char of otthiHomeIdentity()){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return(hash>>>0)%OTTHI_PERSONAL_HOME_LOTS.length;}
  function otthiPersonalHomeLot(){const base=OTTHI_PERSONAL_HOME_LOTS[otthiHomeLotIndex()]||OTTHI_PERSONAL_HOME_LOTS[0],north=base.z<38;return{index:otthiHomeLotIndex(),home:{x:base.x,z:base.z},spawn:{x:base.x,z:base.z+5.2},garage:{x:base.x,z:base.z+(north?13:-13)}};}
  function v704PersonalHomeLotAt(x,z,margin=0){return OTTHI_PERSONAL_HOME_LOTS.some(lot=>Math.abs(Number(x)-lot.x)<=5.2+margin&&Math.abs(Number(z)-lot.z)<=4.3+margin);}
  function worldLayoutPoint(id,fallback={x:0,z:0}){const personal=otthiPersonalHomeLot();if(id==='home')return{...personal.home};if(id==='spawn')return{...personal.spawn};if(id==='homeGarage')return{...personal.garage};const p=WORLD_LAYOUT_V704.points[id];return p?{x:Number(p.x),z:Number(p.z)}:{x:Number(fallback.x||0),z:Number(fallback.z||0)};}
  function worldLayoutRect(id){const zone=WORLD_LAYOUT_V704.zones[id];return zone?{...zone}:null;}
  function worldLayoutStructure(id){const item=WORLD_LAYOUT_V704.structures.find(entry=>entry.id===id);if(!item)return null;const p=item.point?worldLayoutPoint(item.point):item;return{...item,x:Number(item.x??p.x),z:Number(item.z??p.z)};}
  function v704RectOverlap(a,b,margin=0){return Math.abs(Number(a.x)-Number(b.x))<(Number(a.w)+Number(b.w))/2+margin&&Math.abs(Number(a.z)-Number(b.z))<(Number(a.d)+Number(b.d))/2+margin;}
  function v704PointInRect(point,rect,margin=0){return Math.abs(Number(point.x)-Number(rect.x))<=Number(rect.w)/2+margin&&Math.abs(Number(point.z)-Number(rect.z))<=Number(rect.d)/2+margin;}
  function v704RoadFootprint(road,includeSidewalk=true){const side=includeSidewalk?2.7:0;return{...road,w:Number(road.w)+(Number(road.w)>=Number(road.d)?0:side),d:Number(road.d)+(Number(road.w)>=Number(road.d)?side:0)};}
  function v704WorldBounds(){return WORLD_LAYOUT_V704.bounds;}
  function v704WorldSize(){const b=v704WorldBounds();return{w:b.maxX-b.minX,d:b.maxZ-b.minZ};}
  function v704ClampWorldPoint(x,z,margin=1){const b=v704WorldBounds();return{x:Math.max(b.minX+margin,Math.min(b.maxX-margin,Number(x)||0)),z:Math.max(b.minZ+margin,Math.min(b.maxZ-margin,Number(z)||0))};}
  function v704DistanceToSegment(point,a,b){const dx=b.x-a.x,dz=b.z-a.z,len2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.z-a.z)*dz)/len2)),x=a.x+dx*t,z=a.z+dz*t;return{distance:Math.hypot(point.x-x,point.z-z),x,z,t};}
  function v704HighwayById(id){return (WORLD_LAYOUT_V704.highways||[]).find(highway=>highway.id===id)||null;}
  function v704HighwaySignPoint(spec){const highway=v704HighwayById(spec?.highwayId),points=highway?.points||[],index=Number(spec?.segmentIndex);if(!highway||!Number.isInteger(index)||index<0||index>=points.length-(highway.closed?0:1))return null;const a=points[index],b=points[(index+1)%points.length],t=Math.max(0,Math.min(1,Number(spec.t??.5))),dx=b.x-a.x,dz=b.z-a.z,heading=Math.atan2(dx,dz),rx=Math.cos(heading),rz=-Math.sin(heading),side=Number(spec.side||1)>=0?1:-1;
    /* O afastamento considera a meia largura física da placa, não apenas o poste. */
    const signHalfWidth=2.9,offset=Number(highway.width||10)/2+Number(highway.shoulder||0)+Number(spec.offset||2.2)+signHalfWidth;return{x:a.x+dx*t+rx*offset*side,z:a.z+dz*t+rz*offset*side,heading,highwayId:highway.id};}
  function v704HighwaySegments(){const out=[];for(const highway of WORLD_LAYOUT_V704.highways||[]){const points=highway.points||[];for(let i=0;i<points.length-(highway.closed?0:1);i++){const a=points[i],b=points[(i+1)%points.length];out.push({id:`${highway.id}-${i}`,highwayId:highway.id,index:i,a,b,width:Number(highway.width||10),shoulder:Number(highway.shoulder||0)});}}return out;}
  function v704HighwayAt(x,z,margin=0,includeShoulder=true){const point={x:Number(x),z:Number(z)};return v704HighwaySegments().some(seg=>v704DistanceToSegment(point,seg.a,seg.b).distance<=seg.width/2+(includeShoulder?seg.shoulder:0)+margin);}
  function v704HighwayIntersectsRect(highwayId,rect,margin=0){for(const seg of v704HighwaySegments().filter(x=>x.highwayId===highwayId)){const width=seg.width/2+seg.shoulder+margin,len=Math.hypot(seg.b.x-seg.a.x,seg.b.z-seg.a.z),steps=Math.max(2,Math.ceil(len/1.25));for(let i=0;i<=steps;i++){const t=i/steps,p={x:seg.a.x+(seg.b.x-seg.a.x)*t,z:seg.a.z+(seg.b.z-seg.a.z)*t};if(v704PointInRect(p,rect,width))return true;}}return false;}
  function v704RoadAt(x,z,margin=0,includeSidewalk=false){return WORLD_LAYOUT_V704.roads.some(road=>v704PointInRect({x,z},v704RoadFootprint(road,includeSidewalk),margin))||v704HighwayAt(x,z,margin,includeSidewalk);}
  function v704SafeSignPoint(x,z,rotationY=0){
    const base={x:Number(x),z:Number(z)},half=1.08,alongX=Math.cos(rotationY)*half,alongZ=-Math.sin(rotationY)*half,normalX=Math.sin(rotationY),normalZ=Math.cos(rotationY);
    const clear=point=>![{x:point.x,z:point.z},{x:point.x+alongX,z:point.z+alongZ},{x:point.x-alongX,z:point.z-alongZ}].some(sample=>v704RoadAt(sample.x,sample.z,.38,true));
    if(clear(base))return base;
    for(const distance of [1.5,2.4,3.4,4.6,6,7.5,9,11,14])for(const side of [1,-1]){const candidate={x:base.x+normalX*distance*side,z:base.z+normalZ*distance*side};if(clear(candidate))return candidate;}
    /* Em cruzamentos, mover somente pela normal pode cair sobre a via transversal. */
    const tangentX=Math.cos(rotationY),tangentZ=-Math.sin(rotationY);for(const distance of [4.6,6,7.5,9,11,14])for(const side of [1,-1])for(const tangentSide of [1,-1]){const candidate={x:base.x+normalX*distance*side+tangentX*distance*tangentSide,z:base.z+normalZ*distance*side+tangentZ*distance*tangentSide};if(clear(candidate))return candidate;}
    return{x:base.x+normalX*14,z:base.z+normalZ*14};
  }
  function v704ZoneAt(x,z,margin=0){return Object.values(WORLD_LAYOUT_V704.zones).filter(zone=>v704PointInRect({x,z},zone,margin)).map(zone=>zone.id);}
  function v704ConstructionAt(x,z,margin=0){return v704PointInRect({x,z},WORLD_LAYOUT_V704.zones.construction,-Math.abs(margin));}
  function v704ProtectedRectangles(){return WORLD_LAYOUT_V704.structures.filter(item=>item.kind!=='sport-inner'&&item.kind!=='construction').map(item=>worldLayoutStructure(item.id));}
  function v704ReservedAt(x,z,margin=0){if(v704RoadAt(x,z,margin,true))return true;return v704ProtectedRectangles().some(rect=>v704PointInRect({x,z},rect,Number(rect.margin||0)+margin));}
  function v704BuildAllowedAt(x,z,w=1.5,d=1.5){const zone=WORLD_LAYOUT_V704.zones.construction,rect={x,z,w,d};if(x-w/2<zone.x-zone.w/2||x+w/2>zone.x+zone.w/2||z-d/2<zone.z-zone.d/2||z+d/2>zone.z+zone.d/2)return false;if(WORLD_LAYOUT_V704.roads.some(road=>v704RectOverlap(rect,v704RoadFootprint(road,true),.25)))return false;return !(WORLD_LAYOUT_V704.highways||[]).some(highway=>v704HighwayIntersectsRect(highway.id,rect,.25));}
  function v704NearestConstructionSlot(index=0){const zone=WORLD_LAYOUT_V704.zones.construction,columns=6,spacingX=5,spacingZ=5,row=Math.floor(index/columns),column=index%columns;return{x:zone.x-zone.w/2+3+column*spacingX,z:zone.z-zone.d/2+3+row*spacingZ};}
  function v704PathRect(path){const dx=Number(path.x2)-Number(path.x1),dz=Number(path.z2)-Number(path.z1),length=Math.hypot(dx,dz);return{id:path.id,x:(path.x1+path.x2)/2,z:(path.z1+path.z2)/2,w:Math.abs(dx)+Number(path.w||2),d:Math.abs(dz)+Number(path.w||2),rotation:Math.atan2(dx,dz),length};}
  function v704StaticWorldAudit(){
    const problems=[],roads=WORLD_LAYOUT_V704.roads.map(road=>v704RoadFootprint(road,true)),structures=WORLD_LAYOUT_V704.structures.map(item=>worldLayoutStructure(item.id)),bounds=WORLD_LAYOUT_V704.bounds;
    const compatible=new Set(['stadium|football-field','football-field|stadium']);
    for(const road of roads){if(road.x-road.w/2<bounds.minX||road.x+road.w/2>bounds.maxX||road.z-road.d/2<bounds.minZ||road.z+road.d/2>bounds.maxZ)problems.push({type:'road-out-of-bounds',a:road.id});}
    for(const highway of WORLD_LAYOUT_V704.highways||[])for(const point of highway.points||[]){const margin=Number(highway.width||10)/2+Number(highway.shoulder||0);if(point.x-margin<bounds.minX||point.x+margin>bounds.maxX||point.z-margin<bounds.minZ||point.z+margin>bounds.maxZ)problems.push({type:'highway-out-of-bounds',a:highway.id});}
    for(const item of structures){
      if(item.x-item.w/2<bounds.minX||item.x+item.w/2>bounds.maxX||item.z-item.d/2<bounds.minZ||item.z+item.d/2>bounds.maxZ)problems.push({type:'structure-out-of-bounds',a:item.id});
      if(item.kind==='construction')continue;
      for(const road of roads){if((item.allowedRoads||[]).includes(road.id))continue;if(v704RectOverlap(item,road,Number(item.margin||0)))problems.push({type:'structure-on-road',a:item.id,b:road.id});}
      for(const highway of WORLD_LAYOUT_V704.highways||[]){if((item.allowedHighways||[]).includes(highway.id))continue;if(v704HighwayIntersectsRect(highway.id,item,Number(item.margin||0)))problems.push({type:'structure-on-highway',a:item.id,b:highway.id});}
    }
    for(let i=0;i<structures.length;i++)for(let j=i+1;j<structures.length;j++){
      const a=structures[i],b=structures[j];if(a.kind==='construction'||b.kind==='construction'||compatible.has(`${a.id}|${b.id}`)||a.inside===b.id||b.inside===a.id)continue;
      if(v704RectOverlap(a,b,Math.max(Number(a.margin||0),Number(b.margin||0))))problems.push({type:'structure-overlap',a:a.id,b:b.id});
    }
    const water=[WORLD_LAYOUT_V704.zones.lake,WORLD_LAYOUT_V704.zones.lakeNorth];
    for(const hazard of water)for(const road of roads)if(v704RectOverlap(hazard,road,.15))problems.push({type:'water-on-road',a:hazard.id,b:road.id});
    for(const item of structures.filter(s=>!['terrain'].includes(s.kind)))for(const hazard of water)if(v704RectOverlap(item,hazard,.1))problems.push({type:'structure-in-water',a:item.id,b:hazard.id});
    for(const path of WORLD_LAYOUT_V704.paths){const rect=v704PathRect(path);for(const structure of structures){if(['construction-zone'].includes(structure.id)||path.destination===structure.id)continue;const startInside=v704PointInRect({x:path.x1,z:path.z1},structure,.1),endInside=v704PointInRect({x:path.x2,z:path.z2},structure,.1);if(!startInside&&!endInside&&v704RectOverlap(rect,structure,.2))problems.push({type:'path-through-structure',a:path.id,b:structure.id});}}
    for(const sign of WORLD_LAYOUT_V704.signs||[]){const point=sign.kind==='highway'?v704HighwaySignPoint(sign):{x:Number(sign.x),z:Number(sign.z)};if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.z)){problems.push({type:'sign-invalid',a:sign.id});continue;}if(point.x<bounds.minX||point.x>bounds.maxX||point.z<bounds.minZ||point.z>bounds.maxZ)problems.push({type:'sign-out-of-bounds',a:sign.id});if(sign.kind==='guide'){if(roads.some(road=>v704PointInRect(point,road,.18)))problems.push({type:'guide-sign-on-road',a:sign.id});for(const highway of WORLD_LAYOUT_V704.highways||[])if(v704HighwayIntersectsRect(highway.id,{x:point.x,z:point.z,w:.3,d:.3},.1))problems.push({type:'guide-sign-on-highway',a:sign.id,b:highway.id});for(const hazard of water)if(v704PointInRect(point,hazard,.2))problems.push({type:'guide-sign-in-water',a:sign.id,b:hazard.id});for(const structure of structures)if(structure.kind!=='construction'&&v704PointInRect(point,structure,.15))problems.push({type:'guide-sign-in-structure',a:sign.id,b:structure.id});}else if(sign.kind==='highway'){const highway=v704HighwayById(sign.highwayId);if(!highway)problems.push({type:'highway-sign-route-missing',a:sign.id,b:sign.highwayId});}}
    return{version:704,passed:problems.length===0,problems,roads:roads.length,highways:(WORLD_LAYOUT_V704.highways||[]).length,structures:structures.length,zones:Object.keys(WORLD_LAYOUT_V704.zones).length,paths:WORLD_LAYOUT_V704.paths.length,signs:(WORLD_LAYOUT_V704.signs||[]).length};
  }
  function v704ActualHouseRect(house){
    if(!house)return null;
    const source=worldLayoutStructure(house.id==='castle-hall'?'castle':house.id);
    return{id:String(source?.id||house.id||'house'),runtimeId:String(house.id||''),kind:source?.kind||'runtime-house',x:Number(house.x??source?.x),z:Number(house.z??source?.z),w:Number(source?.w||house.w||9),d:Number(source?.d||house.d||7),allowedRoads:[...(source?.allowedRoads||[])],allowedHighways:[...(source?.allowedHighways||[])]};
  }
  function v704PathConnectedToRoad(point){
    const paths=WORLD_LAYOUT_V704.paths||[],nodes=[];
    for(const path of paths){const a={x:Number(path.x1),z:Number(path.z1)},b={x:Number(path.x2),z:Number(path.z2)},ai=nodes.push(a)-1,bi=nodes.push(b)-1;a.peer=bi;b.peer=ai;}
    const queue=[],visited=new Set();nodes.forEach((node,index)=>{if(Math.hypot(node.x-point.x,node.z-point.z)<=3.6){queue.push(index);visited.add(index);}});
    while(queue.length){const index=queue.shift(),node=nodes[index];if(v704RoadAt(node.x,node.z,.85,true))return true;for(const next of [node.peer,...nodes.map((other,otherIndex)=>otherIndex!==index&&Math.hypot(other.x-node.x,other.z-node.z)<=1.15?otherIndex:-1).filter(otherIndex=>otherIndex>=0)])if(!visited.has(next)){visited.add(next);queue.push(next);}}
    return false;
  }
  function v704RuntimeWorldAudit(){
    const problems=[],roads=WORLD_LAYOUT_V704.roads.map(road=>v704RoadFootprint(road,true)),protectedRects=v704ProtectedRectangles(),houses=(world?.houses||[]).map(v704ActualHouseRect).filter(Boolean),vehicles=world?.vehicles||[],hazards=world?.hazards||[];
    const add=(type,a,b='',detail='')=>problems.push({type,a:String(a||''),b:String(b||''),detail:String(detail||'')});
    for(const house of houses)for(const road of roads)if(!(house.allowedRoads||[]).includes(road.id)&&v704RectOverlap(house,road,1.0))add('house-on-road',house.id,road.id);for(const house of houses)for(const highway of WORLD_LAYOUT_V704.highways||[])if(!(house.allowedHighways||[]).includes(highway.id)&&v704HighwayIntersectsRect(highway.id,house,1.0))add('house-on-highway',house.id,highway.id);
    for(let i=0;i<houses.length;i++)for(let j=i+1;j<houses.length;j++)if(v704RectOverlap(houses[i],houses[j],1.0))add('house-overlap',houses[i].id,houses[j].id);
    for(const house of houses)for(const hazard of hazards)if(Number.isFinite(hazard.w)&&v704RectOverlap(house,hazard,.25))add('house-in-hazard',house.id,hazard.type);
    const protectedGameplay=protectedRects.filter(rect=>['sport','kart','farm','castle'].includes(rect.kind));for(const collider of world?.colliders||[]){const rect={x:Number(collider.x),z:Number(collider.z),w:Number(collider.w),d:Number(collider.d)};if(!Number.isFinite(rect.x)||collider.sportsV704||collider.kartV704)continue;for(const protectedRect of protectedGameplay){if(protectedRect.kind==='castle'&&collider.castle)continue;if(v704RectOverlap(rect,protectedRect,.15))add('collider-in-protected-area',collider.houseId||collider.buildId||collider.landmark||'collider',protectedRect.id);}}
    for(const vehicle of vehicles){const x=Number(vehicle.group?.position?.x??vehicle.x),z=Number(vehicle.group?.position?.z??vehicle.z),id=String(vehicle.id||'vehicle');if(!Number.isFinite(x)||!Number.isFinite(z)){add('vehicle-invalid-position',id);continue;}const isKart=String(vehicle.kind||'')==='kart',owned=Array.isArray(state?.vehicles?.owned)&&state.vehicles.owned.includes(id);if(!isKart)for(const road of roads)if(v704PointInRect({x,z},road,Number(vehicle.radius||1.35)))add('vehicle-on-road',id,road.id);for(const structure of protectedRects){if(isKart&&['kart-circuit','kart-boxes'].includes(structure.id))continue;if(structure.kind==='garage'&&owned)continue;if(v704PointInRect({x,z},structure,1.2))add('vehicle-inside-structure',id,structure.id);}}
    const busStops=world?.busStops||[];for(const stop of busStops){const x=Number(stop.sign?.position?.x??stop.x),z=Number(stop.sign?.position?.z??stop.z),rotation=Number(stop.sign?.rotation?.y||0),samples=[{x,z},{x:x+Math.cos(rotation)*1.08,z:z-Math.sin(rotation)*1.08},{x:x-Math.cos(rotation)*1.08,z:z+Math.sin(rotation)*1.08}];if(samples.some(sample=>v704RoadAt(sample.x,sample.z,.38,true)))add('bus-stop-sign-on-road',stop.id,'road-or-sidewalk');}for(let i=0;i<busStops.length;i++)for(let j=i+1;j<busStops.length;j++)if(Math.hypot(busStops[i].x-busStops[j].x,busStops[i].z-busStops[j].z)<3.5)add('duplicate-bus-stop-sign',busStops[i].id,busStops[j].id);
    const spawn=worldLayoutPoint('spawn');if(typeof positionBlockedForPlayer==='function'&&positionBlockedForPlayer(spawn.x,spawn.z,.42,{ignoreTraffic:true,allowWater:false}))add('spawn-blocked','spawn');
    const important=['sportsEntrance','footballEntrance','volleyEntrance','footvolleyEntrance','kartEntrance','farmEntrance','castleEntrance','mountainEntrance','constructionEntrance','ottoviasEntry','ottoviasOperationsAccess','ottoviasTollSouth','ottoviasTollField','ottoviasTollBeach'];for(const id of important){const p=worldLayoutPoint(id);if(typeof nearestRoadProjection==='function'){const projection=nearestRoadProjection(p),pathConnected=v704PathConnectedToRoad(p);if((!projection||projection.distance>18||projection.clear===false)&&!pathConnected)add('destination-inaccessible',id,'road-or-path',projection?`distance=${projection.distance.toFixed(1)}`:'no-projection');}}
    const names={};worldGroup?.traverse?.(object=>{const name=String(object.name||'');if(name)names[name]=(names[name]||0)+1;});for(const name of['OTTHI_V702_FARM','OTTHI_V702_MOUNTAIN','OTTHI_V704_SPORTS','OTTHI_V704_KART'])if((names[name]||0)>1)add('duplicate-world-system',name,String(names[name]));
    const result={version:704,passed:problems.length===0,problems,houses:houses.length,vehicles:vehicles.length,colliders:world?.colliders?.length||0,hazards:hazards.length,interactables:world?.interactables?.length||0,at:Date.now()};world.layoutAuditRuntime=result;if(!result.passed)console.error('[OTTHI V704] auditoria geométrica do mundo real',problems);return result;
  }
  window.OTTHI_WORLD_LAYOUT_V704={layout:WORLD_LAYOUT_V704,point:worldLayoutPoint,zone:worldLayoutRect,structure:worldLayoutStructure,staticAudit:v704StaticWorldAudit,runtimeAudit:v704RuntimeWorldAudit,audit:v704StaticWorldAudit,roadAt:v704RoadAt,highwayAt:v704HighwayAt,highwayById:v704HighwayById,highwaySignPoint:v704HighwaySignPoint,highwaySegments:v704HighwaySegments,reservedAt:v704ReservedAt,buildAllowedAt:v704BuildAllowedAt,constructionSlot:v704NearestConstructionSlot,zonesAt:v704ZoneAt,bounds:v704WorldBounds,clamp:v704ClampWorldPoint};
