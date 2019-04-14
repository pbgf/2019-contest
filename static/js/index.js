let level,//游戏关卡
    game,//本局游戏
    canvas=document.querySelector('#mycanvas'),
    ctx=canvas.getContext("2d"),//画布上下文
    imgurls={
        "block": "./static/img/bigBlock.png",
        "wall": "./static/img/bigWall.png",
        "box": "./static/img/bigBox.png",
        "boxed": "./static/img/boxed.gif",
        "ball": "./static/img/bigBall.png",
        "background":"./static/img/background.png",
        "man":"./static/img/bigMan.png",
        "gameover":"./static/img/yx.png",
        "fail":"./static/img/fail.png"
    },
    startX=100,//游戏界面 起始坐标点x
    startY=100,//游戏界面 起始坐标点y
    times=5;
const man=4,block=0,wall=1,box=3,ball=2,boxed=5;
let imgs={
        "block": "",
        "wall": "",
        "box": "",
        "ball": "",
        "boxed":"",
        "background":"",
        "man":"",
        "gameover":"",
        "fail":""
    }//图片资源
imgload();
function start(){
    let level_btn=""
    document.querySelectorAll('[name="chooseLevel"]').forEach(elem=>{
        if(elem.checked){
            times=Number(elem.value);
        }
    })
    canvas.onmousemove=null;
    canvas.onmousedown=null;
    document.querySelector('body').onkeydown=keyDown;//开始监听按键
    //动态生成关卡数
    for(let i=0;i<levels.length;i++){
        level_btn+=`<input type="button" value="${i+1}" class="levelbutton">`
    }
    document.querySelector('.levelList').innerHTML=level_btn;
    
    //绑定关卡切换按钮事件
    document.querySelector('.levelList').onclick=changeLevel;
    game=new BoxMan(0,ctx);
    game.init();
}
function restart(){
    if(game){
        game.restart();
    }
}
function load(){
    ctx.drawImage(imgs.background, 0, 0, canvas.width, canvas.height);
    canvas.onmousemove=mousemove;
    canvas.onmousedown=mousedown;
}

//游戏初始化界面 鼠标移动和点击事件函数
function mousemove(e){
    canvas.style.cursor="";
    if(e.pageX>1050&&e.pageX<1160&&e.pageY>160&&e.pageY<180){
        canvas.style.cursor="pointer";
    }
}
function mousedown(){
    if(canvas.style.cursor=="pointer"){
        canvas.style.cursor="";
        start();
    }
}

//改变关卡
function changeLevel(e){
    game.changeLevel(e.target.value-1)
}
function imgload(){
    let target=Object.keys(imgurls).length;//总共要加载的图片目标数
    let cnt=0;//计数 已加载完成的图片数
    Object.keys(imgurls).forEach(prop=>{
        let img=document.createElement('img');
        img.src=imgurls[prop];
        img.onload=function(){
            cnt++;
            if(cnt==target){
                load();
            }
        }
        imgs[prop]=img;
    })
}
function keyDown(e){
    if(e.keyCode==37){//左按键
        game.leftWalk();
    }else if(e.keyCode==38){//上按键
        game.topWalk();
    }else if(e.keyCode==39){//右按键
        game.rightWalk();
    }else if(e.keyCode==40){//下按键
        game.downWalk();
    }
}
class BoxMan{
    constructor(level,ctx){
        this._level;//等级
        this.map=levels[level];//地图
        this.grid;
        this.ctx=ctx;//画布上下文
        this.man;//
        this.cnt;//计数器 当前已经推到了几个箱子
        this.target;//总共需要推进几个箱子
        this.restartCnt=0;//记录重玩次数
        this.topLevel=levels.length;
        this.successedLevel=[];//已通过的关数
        //注册level change回调函数
        Object.defineProperty(this,'level',{
            get:function(){
                return this._level;
            },
            set:function(val){
                this._level=val;
                //设置当前关卡按钮样式
                if(document.querySelector('.currentlevel')){
                    document.querySelector('.currentlevel').classList.remove('currentlevel')
                }
                if(document.querySelectorAll('.levelbutton')[this._level]){
                    document.querySelectorAll('.levelbutton')[this._level].classList.add('currentlevel')
                }
            }
        })
        this.level=level;
    }
    //初始化游戏
    init(){
        this.cnt=0;
        this.target=0;
        this.grid=JSON.parse(JSON.stringify(levels[this.level]));//当前游戏面板
        this.drawMap(this.map,true)
        //this.map[this.man.r][this.man.c]=block
    }
    restart(){
        this.init();
        this.restartCnt++;
        if(this.restartCnt==(times+1)){
            this.gameover(false)
        }if(this.restartCnt==(times+2)){
            window.location.reload();
        }
    }
    //绘制推箱子地图
    drawMap(map,isInit){
        //清空画布
        ctx.clearRect(0,0,canvas.width,canvas.height);
        //背景色
        ctx.rect(0,0,canvas.width,canvas.height);
        ctx.fillStyle="#933a29";
        ctx.fill(); 
        //绘制推箱子游戏
        let row=map.length;
        let grid=map;
        for(let i=0;i<row;i++){
            let col=grid[i].length;
            for(let j=0;j<col;j++){
                let cell=grid[i][j];
                cell=this.generator(cell,i,j,isInit);
                ctx.drawImage(cell,j*50+startY,i*50+startX,50,50)
            }
        }
    }
    //根据描述符加工生成具体物品
    generator(descriptor,r,c,isInit){
        switch(descriptor){
            case block:return imgs['block'];
            case wall:return imgs['wall'];//wall
            case ball:isInit?this.target++:'';return imgs['ball'];//target 加一
            case box:return imgs['box'];//box
            case man:this.man={r:r,c:c};return imgs['man'];//man 记录man的初始位置 不用每次去遍历查找
            case boxed:return imgs['boxed'];
        }
    }
    changeLevel(level){
        this.level=level;
        this.map=levels[this.level];
        this.init();
    }
    leftWalk(){
        let next={r:this.man.r,c:this.man.c-1};
        let target=this.grid[next.r][next.c];
        let targetNext=this.grid[next.r][next.c-1];
        let isBoxed=0;
        switch(target){
            case wall:break;//wall
            case ball:
            case block:
                this.grid[this.man.r][this.man.c]=this.restore(this.man.r,this.man.c);//复原 原地图的物品
                this.man=next;
                this.grid[this.man.r][this.man.c]=man;//target
                break;
            case boxed:isBoxed=1;//经过了boxed
            case box://box
                if(targetNext!=wall){
                    this.grid[this.man.r][this.man.c]=this.restore(this.man.r,this.man.c);//复原 原地图的物品
                    this.man=next;
                    this.grid[this.man.r][this.man.c]=man;
                    if(isBoxed){
                        this.cnt--;
                    }
                }
                if(targetNext==block){
                    this.grid[this.man.r][this.man.c-1]=box;
                }else if(targetNext==ball){
                    this.grid[this.man.r][this.man.c-1]=boxed;
                    this.cnt++;
                }
        }
        //绘制
        this.drawMap(this.grid);
        if(this.isSuccess()){
            this.isNext();
        }
    }
    topWalk(){
        let next={r:this.man.r-1,c:this.man.c};
        let target=this.grid[next.r][next.c];
        let targetNext=this.grid[next.r-1][next.c];
        let isBoxed=0;
        switch(target){
            case wall:break;//wall
            case ball:
            case block:
                this.grid[this.man.r][this.man.c]=this.restore(this.man.r,this.man.c);//复原 原地图的物品
                this.man=next;
                this.grid[this.man.r][this.man.c]=man;//target
                break;
            case boxed:isBoxed=1;
            case box://box
                if(targetNext!=wall){
                    this.grid[this.man.r][this.man.c]=this.restore(this.man.r,this.man.c);//复原 原地图的物品
                    this.man=next;
                    this.grid[this.man.r][this.man.c]=man;
                    if(isBoxed){
                        this.cnt--;
                    }
                }
                if(targetNext==block){
                    this.grid[this.man.r-1][this.man.c]=box;
                }else if(targetNext==ball){
                    this.grid[this.man.r-1][this.man.c]=boxed;
                    this.cnt++;
                }
        }
        //绘制
        this.drawMap(this.grid);
        if(this.isSuccess()){
            this.isNext();
        }
    }
    rightWalk(){
        let next={r:this.man.r,c:this.man.c+1};
        let target=this.grid[next.r][next.c];
        let targetNext=this.grid[next.r][next.c+1];
        let isBoxed=0;
        switch(target){
            case wall:break;//wall
            case ball:
            case block:
                this.grid[this.man.r][this.man.c]=this.restore(this.man.r,this.man.c);//复原 原地图的物品
                this.man=next;
                this.grid[this.man.r][this.man.c]=man;//target
                break;
            case boxed:isBoxed=1;
            case box://box
                if(targetNext!=wall){
                    this.grid[this.man.r][this.man.c]=this.restore(this.man.r,this.man.c);//复原 原地图的物品
                    this.man=next;
                    this.grid[this.man.r][this.man.c]=man;
                    if(isBoxed){
                        this.cnt--;
                    }
                }
                if(targetNext==block){
                    this.grid[this.man.r][this.man.c+1]=box;
                }else if(targetNext==ball){
                    this.grid[this.man.r][this.man.c+1]=boxed;
                    this.cnt++;
                }
        }
        //绘制
        this.drawMap(this.grid);
        if(this.isSuccess()){
            this.isNext();
        }
    }
    downWalk(){
        let next={r:this.man.r+1,c:this.man.c};
        let target=this.grid[next.r][next.c];
        let targetNext=this.grid[next.r+1][next.c];
        let isBoxed=0;
        switch(target){
            case wall:break;//wall
            case ball:
            case block:
                this.grid[this.man.r][this.man.c]=this.restore(this.man.r,this.man.c);//复原 原地图的物品
                this.man=next;
                this.grid[this.man.r][this.man.c]=man;//target
                break;
            case boxed:isBoxed=1;
            case box://box
                if(targetNext!=wall){
                    this.grid[this.man.r][this.man.c]=this.restore(this.man.r,this.man.c);//复原 原地图的物品
                    this.man=next;
                    this.grid[this.man.r][this.man.c]=man;
                    if(isBoxed){
                        this.cnt--;
                    }
                }
                if(targetNext==block){
                    this.grid[this.man.r+1][this.man.c]=box;
                }else if(targetNext==ball){
                    this.grid[this.man.r+1][this.man.c]=boxed;
                    this.cnt++;
                }
        }
        //绘制
        this.drawMap(this.grid);
        if(this.isSuccess()){
            this.isNext();
        }
    }
    restore(i,j){
        let item = this.map[i][j];
        if(item==ball){
            return ball
        }else{
            return block
        }
    }
    isSuccess(){
        if(this.cnt==this.target){
            return true;
        }
        return false;
    }
    isNext(){
        this.successedLevel.push(this.level)
        //跳到还未通过的关卡
        if(this.level+1<this.topLevel&&this.successedLevel.indexOf(this.level+1)==-1){
            this.level++;
        }else{
            for(let i=0;i<this.topLevel;i++){
                if(this.successedLevel.indexOf(i)==-1){
                    this.level=i;
                    break;
                }
            }
        }
        if(this.successedLevel.length==this.topLevel){
            this.gameover(true);
        }else{
            this.map=levels[this.level];
            this.init();
        }
    }
    gameover(isSuccess){
        if(isSuccess){
            this.ctx.drawImage(imgs.gameover,0,0,canvas.width,canvas.height)
            document.querySelector('body').onkeydown=null;
        }else{
            this.ctx.drawImage(imgs.fail,250,325,300,150)
            document.querySelector('body').onkeydown=null;
        }
        //重载
        setTimeout(()=>{
            window.location.reload();
        },2000)
    }
}