"use strict";

/*
  id名について、複数単語を合わせる場合は「＿」アンダーバーでつなぐ
*/

var AreaModel = function(){
  this.label; //市区町村名
}

var PoliticianModel = function(){
  this.area; //市区町村名
  this.label; //国県市区町村
  this.belonging; //所属政党
  this.status; //議員区分名
  this.account; //Twitterアカウント名
  this.name; //名前
}

$(function(){

  var areaModels = new Array(); //エリアモデルの配列
  var politicianModels = new Array(); //政治家モデルの配列
  var tabNames = new Array(); //タブリストの表示名配列=議会区分

  console.log("script called");
  /*
    selected_area_name : localStorageに保存する際のKey
  */
  function getSelectedAreaName(){
    return localStorage.getItem("selected_area_name");
  }
  /*
    LocalStorageに居住地情報を保存（ブラウザに保存される）
  */
  function setSelectedAreaName(name){
    localStorage.setItem("selected_area_name", name);
  }

/*
  csvファイルは、UTF-8でないとダメ
*/
  function csvToArray(filename, callback){
    $.get(filename, function(csvData){
      csvData = csvData.replace(/\r/gm, "");
      var line = csvData.split("\n"), //配列、現状は「label」と市区町村名のみ
          ret = [];
      for(var i in line){
        if(line[i].length == 0) continue; //空行はスルー
        var row = line[i].split(",");
        ret.push(row);
      }
      console.log("csvToArray");
      callback(ret); //Callback実行
    });
  }

  function updateAreaList(){
    csvToArray("data/area_data.csv", function(tmp){
      var area_data_labels = tmp.shift(); // = labal
      for(var i in tmp){
        var row = tmp[i]; //現状は市区町村名のみ
        var area = new AreaModel();
        area.label = row; //rowは市区町村名のみであるため、配列型ではないから[n]は不要

        areaModels.push(area);
      }
      // var selected_name = getSelectedAreaName();
      var area_select_form = $("#select_area"); //selectフォーム
      var select_html = "";
      select_html += '<option value = "-1">地域を選択してください</option>';
      for(var index in areaModels){
        var area_name = areaModels[index].label;
        // var selected = (selected_name == area_name) ? 'selected="selected"' : "";

        select_html += '<option value="' + index + '" >' + area_name + '</option>';
      }

      //デバッグ用
      if (typeof dump == "function") {
        dump(areaModels);
      }

      //HTMLへ適用
      area_select_form.html(select_html);
      area_select_form.change();
    });
  }

  /*
    選択した市区町村で該当するアカウントをリストで生成
  */
  function createPoliList(after_action){
    csvToArray("data/roster_data.csv", function(data){
      data.shift(); //一つはカテゴリ名の配列なので削除(.shiftは0番目の添え字の要素を取り除く)
      //全市区町村のデータが配列として取得されているので、選択した市区町村のものを抽出
      var selectedArea = getSelectedAreaName();
      politicianModels.length = 0; //配列初期化
      for(var i in data){
        var row = data[i]; //1人当たりのデータ(配列)
        if(row[0] == selectedArea){
          var politician = new PoliticianModel();
          politician.area = row[0];
          politician.label = row[1];
          politician.belonging = row[2];
          politician.status = row[3];
          politician.account = row[4];
          politician.name = row[5];

          politicianModels.push(politician);
        }
      }

      after_action();
    });
  }

  /*
    accordion部分にタブリストを生成
  */
  function createTabMenu(dataCallback){
    var tab = $("#tabs");
    var tab_html ="";
    var selected_area = getSelectedAreaName();
    //tab-titleとtab-contentsを挿入する
    /*TAB-TITLE*/
    tab_html += "<ul id='tab_title'>";
    for(var num = 1; num < 5; num++){
      tab_html += "<li id='tab" + num + "'></li>";
    }
    tab_html += "<div class='tab-title-bar'></div>"; //スライダー
    tab_html += "</ul>";

    /*TAB-CONTENTS*/
    tab_html += "<ul id='tab_contents'>";
    for(var num=1; num<5; num++){
      if(num==1){
        tab_html += "<li id='content" + num +"' class='listContent active'></li>";
        continue;
      }
      tab_html += "<li id='content" + num +"' class='listContent'></li>";
    }
    tab_html += "</ul>";

    /*HTMLに反映*/
    tab.html(tab_html);


    $("ul, li").css({'display':'block', 'margin':'0', 'padding':'0', 'list-style-type':'none'});
    $("#tab_title").css({'position':'relative', 'width':'100%'});
    $("#tab_title:before, #tab_title:after").css({'display':'table', 'content':''});
    $("#tab_title:after").css('clear', 'both');
    $("#tab_title li").css({'display':'inline-block', 'background-color':'#fa6d2e',
                            'color':'#fff', 'text-align':'center', 'padding':'.8em 0',
                            'width':'25%', 'cursor':'pointer'});
    $(".tab-title-bar").css({'position':'absolute', 'left':'0', 'bottom':'0',
                              'width':'25%', 'height':'3px', 'background-color':'#FAB42E',
                              '-webkit-transition':' .30s ease-in-out',
                              '-moz-transition':' .30s ease-in-out',
                              '-o-transition':' .30s ease-in-out',
                              'transition':' .30s ease-in-out'})
    $("#tab_contents .listContent").css({'display':'none', 'padding':'1.4em', 'background-color':'#90cbc7'});
    $("#tab_contents .listContent.active").css('display', 'block');
    //tabの選択時
    $("#tab_title li").on('click', function(){
      var position = $(this).index(); //選択されたタブのINDEX
      var $contents = $("#tab_contents .listContent");
      $contents.removeClass('active');
      $contents.eq(position).addClass('active');

      //スライドバー
      var positionSlider = $(this).width()*position; //スライダーの位置
      $(".tab-title-bar").css('left', positionSlider+'px');
    });

    dataCallback();
  }

  function updateData(){
    var selected_area = getSelectedAreaName(); //選択エリア
    /*
      タブへのデータ反映
    */
    //国・県タブ
    $("#tab2").html("国");
    $("#tab3").html("県");
    //選択エリアから、タブ表示名を反映させる
    var cityKey = selected_area.slice(-1); //市.区.町.村のどれか
    switch (cityKey) {
      case "市":
        $("#tab1").html("市長");
        $("#tab4").html("市");
        break;
      case "区":
        $("#tab1").html("区長");
        $("#tab4").html("区");
        break;
      case "町":
        $("#tab1").html("町長");
        $("#tab4").html("町");
        break;
      case "村":
        $("#tab1").html("村長");
        $("#tab4").html("村");
        break;
    }
    /*
      コンテンツ部分へのデータ反映
    */
    //全てのタブコンテンツにデータ無し用レイアウトを挿入
    var list_html = "";
    list_html += "<ul id='list'>";
    list_html += "<li class='noData'>該当するデータはありません</li>";
    list_html += "</ul>";
    $(".listContent").html(list_html);
    //個別のタブコンテンツ処理
    for (var i = 0; i <  politicianModels.length; i++) {
      var politician = politicianModels[i];
      var labelGroup = politician.label;

      switch (labelGroup) {
        case "市長":
          //noData部分を削除
          $("#content1 .noData").remove();
          var content1_html = "";
          content1_html += "<li>";
          content1_html += "<p>"+ politician.belonging+" <br/>"+politician.status+"</p>";
          content1_html +="<h3>"+politician.name+"</h3>";
          content1_html += "<a href='#'>@"+politician.account+"</a>";
          content1_html += "</li>";
          $("#content1 #list").html(content1_html);
          break;
        case "国政":
          break;
        case "県議会":
          break;
        case "市議会":
          break;
      }
    }

    $("#list").css('list-style-type','none');


  }

  function onChangeSelect(index){
    if(index == -1){
      //初期値の場合,変化なし
      $("#tabs").html("");
      setSelectedAreaName("");
      return;
    }
    //初期値以外の処理
    setSelectedAreaName(areaModels[index].label); //選択市区町村を保存
    if($("#tabs").children().length === 0){
      //tabsに子要素が無い場合、roster.csvからタブリスト生成
      createPoliList(function(){
        createTabMenu(function(){
          updateData();
        });
      });
    }else {
      createPoliList(function(){
        updateData();
      });

    }
  }

  //市区町村リスト選択時
  $("#select_area").change(function(data){
    var index = $(data.target).val(); //選択した市区町村固有のValue値を取得
    onChangeSelect(index);
  });



  updateAreaList();


});
