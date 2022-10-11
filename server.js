// 설치한것을 불러들여 그 안의 함수 명령어들을 쓰기위해 변수로 세팅
const express = require("express");
// 데이터베이스의 데이터 입력, 출력을 위한 함수명령어 불러들이는 작업
const MongoClient = require("mongodb").MongoClient;
const app = express();

// 포트번호 변수로 세팅
const port = 8080;

// ejs 태그를 사용하기 위한 세팅
app.set("view engine","ejs");
// 사용자가 입력한 데이터값을 주소로 통해서 전달되는 것을 변환(parsing)
app.use(express.urlencoded({extended: true}));
// css나 img, js와 같은 정적인 파일 사용하려면 ↓ 하단의 코드를 작성해야한다.
app.use(express.static('public'));

// Mongodb 데이터 베이스 연결작업
// 데이터베이스 연결을 위한 변수 세팅 (변수의 이름은 자유롭게 지어도 ok)
let db;
// Mongodb에서 데이터베이스를 만들고 데이터베이스 클릭 → connect → Connect your application → 주소 복사, password에는 데이터베이스 만들때 썼었던 비밀번호를 입력해 준다.
MongoClient.connect("mongodb+srv://admin:qwer1234@testdb.g2xxxrk.mongodb.net/?retryWrites=true&w=majority",function(err,result){
    // 에러가 발생했을 경우 메세지 출력 (선택사항임. 안쓴다고 해서 문제가 되지는 않는다.)
    if(err){ return console.log(err);}

    // 위에서 만든 db변수에 최종적으로 연결 / ()안에는 mongodb atlas에서 생성한 데이터 베이스 이름 집어넣기
    db = result.db("testdb");

    // db연결이 제대로 되었다면 서버 실행
    app.listen(port,function(){
        console.log("서버연결 성공");
    });
});

// 메인페이지 경로 요청
app.get("/",function(req,res){
    res.send("메인페이지 접속 완료");
    // res.sendFile(__dirname + "/html파일 명.html")
    // res.render("ejs파일 명");
    // res.redirect("/주소");
});

// list경로로 요청하면 brd_list.ejs파일을 응답해줌(보여줌) 
app.get("/list",function(req,res){
    // res.render("brd_list");
    // ex5_board 컬렉션에 있는 모든 데이터를 전부 다 가지고 와서 brd_list.ejs 파일에 전달
    db.collection("ex5_board").find().toArray(function(err,result){
        res.render("brd_list",{data:result});
    });
});

// insert경로로 요청했을경우 brd_insert.ejs파일을 응답해줌(보여줌)
app.get("/insert",function(req,res){
    res.render("brd_insert");
});

// add경로로 요청하면 입력페이지에서 전달한 데이터 값들을 데이터 베이스에 추가!
app.post("/add",function(req,res){
    // ex5_count 컬렉션에 totalCount 값을 수정하기 위해서 데이터 갖고오는 작업부터 먼저 진행
    db.collection("ex5_count").findOne({name:"게시글갯수"},function(err,result){
        // ex5_board에 입력한 데이터를 저장
        db.collection("ex5_board").insertOne({
            brdid:result.totalCount + 1,
            brdtitle:req.body.title,
            brdcontext:req.body.context,
            brdauther: req.body.auther
        },function(err,result){
            // ex_count 컬렉션에 totalCount 프로퍼티를 1 증가시킨 상태로 수정
            // update()시
            // $inc 숫자값을 증가 또는 감소 시킬 때 사용하는 약속된 변수 이름
            // $set 내용 변경 및 수정할때 사용
            db.collection("ex5_count").updateOne({name:"게시글갯수"},{$inc:{totalCount:1}},function(err,result){
                // 원하는 페이지로 바로 이동
                res.redirect("/list");
            });
        });
    });
});

// 경로를 /detail/데이터값 으로 요청했을 경우 원하는 게시글 번호의 모든 내용들을 가져와서 콘솔창에 출력

// 주소창에 /:변수명 명시하면 주소창에 내가 입력한 데이터값이 담긴상태로 server.js로 넘어온다.
app.get("/detail/:id",function(req,res){
    // req.params.변수명    →   주소창에 기입한 데이터값이 서버로 넘어오는걸 확인할 수 있다.
    // console.log(req.params.test);
    // res.send("주소창을 통한 데이터 전송");
    
    // 게시글이 있는 컬렉션에 접근해서 해당 게시글 번호로 데이터를 찾아서 가지고 옴
    // 그때 사용된 게시글 번호는 주소창을 통해서 보내준 게시글 번호값이 된다.
    db.collection("ex5_board").findOne({brdid:Number(req.params.id)},function(err,result){
        res.render("brd_detail",{data:result});
    });
});

// 삭제 페이지 작업 시작!!
// delete 경로로 요청하면 데이터베이스 해당 게시글 번호에 데이터들만 삭제처리
app.get("/delete/:id",function(req,res){
    // 삭제하는 명령어 deleteOne();
    db.collection("ex5_board").deleteOne({brdid:Number(req.params.id)},function(err,result){
        res.redirect("/list");
    });
});

// 수정 페이지 작업 시작!!
// uptview 경로로 요청하면 데이터베이스 해당 게시글 수정페이지인 brd_upt.ejs파일을 응답한다.
app.get("/uptview/:id",function(req,res){
    // 데이터베이스에서 해당 번호로 넘어온 값을 가지고 findOne 함수를 이용해
    // 데이터베이스에 있는 게시글 데이터들을 가지고 와서 brd_upt.ejs파일에 전달
    db.collection("ex5_board").findOne({brdid:Number(req.params.id)},function(err,result){
        res.render("brd_upt",{data:result});
    });
});

// /update 경로로 요청하면 해당 게시글 번호에 데이터들을 수정처리!   →   디테일 페이지로 이동
app.post("/update",function(req,res){
    // brd_upt 페이지에서 넘어온 데이터값들을 ex5_board 컬렉션에 해당하는 게시글만 수정처리!
    db.collection("ex5_board").updateOne({brdid:Number(req.body.id)},{$set:{
        brdtitle:req.body.title,
        brdcontext:req.body.context,
        brdauther:req.body.auther
    }},function(err,result){
        res.redirect("/detail/" + req.body.id);
    });
});