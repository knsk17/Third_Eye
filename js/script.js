"use strict";

var AreaModel = function(){
  this.label; //市区町村名
}

var PoliticianModel = function(){
  this.label; //市区町村名
  this.group; //議会区分
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
      var groups = [];
      for(var i in data){
        var row = data[i]; //1人当たりのデータ(配列)
        if(row[0] == selectedArea){
          var politician = new PoliticianModel();
          politician.label = row[0];
          politician.group = row[1];
          politician.account = row[2];
          politician.name = row[3];

          politicianModels.push(politician);
          groups.push(row[1]);
        }
      }
      //タブに表示する用の配列＝議会区分（重複なし）
      tabNames = groups.filter(function(element, index, self){
        return self.indexOf(element) === index;
      });
      after_action();
    });
  }

  /*
    accordion部分にタブリストを生成
  */
  function createTabMenu(){
    var tab = $("#tabs");
    var tab_html ="";
    //タブタイトル
    tab_html += '<ul id="tab-title">';
    var num = 1;
    for(var i in tabNames){
      if(num == 1){
        tab_html += "<li id='tab" +num+ "' class='tab active'><a href='#content" + num + "'>" + tabNames[i] + "</a></li>";
      }else{
        tab_html += "<li id='tab" +num+ "' class='tab'><a href='#content" + num + "'>" + tabNames[i] + "</a></li>";
      }
      num++;
    }
    // tab_html += "<div class = "tab-title-bar"></div>"; //スライダー
    tab_html += "</ul>";
    //タブコンテンツ

    tab.html(tab_html);

    $("ul, li").css({'display':'block', 'margin':'0', 'padding':'0', 'list-style-type':'none'});
    $("#tab-title").css('width', '100%');
    $("#tab-title > .tab").css({'display':'inline-block', 'background-color':'#1c7a74',
                                    'color':'#fff', 'text-align':'center', 'padding':'.8em 0'});

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
      //accordionに子要素が無い場合、roster.csvからタブリスト生成
      createPoliList(function(){
        createTabMenu();
      });

    }
  }

  //市区町村リスト選択時
  $("#select_area").change(function(data){
    var index = $(data.target).val(); //選択した市区町村固有のValue値を取得
    onChangeSelect(index);
  });

  $("#tabs a").on('click', function(e){
    e.preventDefault();

    var target = $(this).attr('href');
    if(!$(target).length) return false;

  })

  updateAreaList();


});
