<?php

$_CONFIG=Array(
	"urlsiteroot"=>"/wright/publishers/site/",
	"urlroot"=>"/wright/",
	"urltapes"=>"/wright/tapes/",
	"pathtapes"=>"../../tapes/",
	"pathdatabase"=>"../database.json",
	"pagesize"=>12
);

$game=0;

function fillTemplate($tmpl,$data) {
	do {
		$found=preg_match('/%%%([^%\n]*)%%%/',$tmpl,$match,PREG_OFFSET_CAPTURE);
		if ($found) {
        	$out="";
        	switch (substr($match[1][0],0,1)) {
        		case "=":{
        			$out=file_get_contents(substr($match[1][0],1));
        			break;
        		}
        		default:{
        			$spl=preg_split("/\./",$match[1][0]);
		        	$out=$data;
		        	for ($i=0;$i<count($spl);$i++) $out=$out[$spl[$i]];
        		}
        	}
        	$tmpl=substr($tmpl,0,$match[0][1]).$out.substr($tmpl,$match[0][1]+strlen($match[0][0]));
		}		
	} while ($found);
	return $tmpl;
}

$notfound=true;
if (isset($_GET)) {

	$data=Array(
		"urlroot"=>$_CONFIG["urlroot"],
		"urlsiteroot"=>$_CONFIG["urlsiteroot"],
		"urltapes"=>$_CONFIG["urltapes"]
	);
	$page=isset($_GET["page"])?$_GET["page"]:"";

	switch ($page) {
		case "issues":{
			$notfound=false;
			$database=json_decode(file_get_contents($_CONFIG["pathdatabase"]),true);
			$pages=ceil(count($database)/$_CONFIG["pagesize"]);
			$pos=isset($_GET["pos"])?$_GET["pos"]*1:1;
			if ($pos<1) $pos=1; else if ($pos>$pages) $pos=$pages;
			$id=$pos-1;
			$first=$id*$_CONFIG["pagesize"];
			$data["count"]=count($database);
			$data["list"]="";
			$data["pages"]="";
			for ($i=0;$i<$_CONFIG["pagesize"];$i++) {
				$id=$first+$i;
				if ($id<count($database))
					$data["list"].='<a class="game" href="'.$_CONFIG["urlroot"]."issue/".$database[$id]["id"].'"><span class="shot" style="background-image:url(\''.$_CONFIG["urltapes"].$database[$id]["id"].'/screenshots/'.$database[$id]["id"].'-2.png\')"></span><span class="tape"><span class="label">'.htmlentities($database[$id]["label"]).'</span><span class="window"><span class="wheelleft"></span><span class="wheelright"></span></span></span></a>';
				else
					break;
			}
			for ($i=1;$i<=$pages;$i++)
				if ($i==$pos) $data["pages"].=$i." ";
				else $data["pages"].='<a href="'.$_CONFIG["urlroot"].'issues/'.$i.'">'.$i."</a> ";
			echo fillTemplate(file_get_contents("templates/issues.html"),$data);
			break;
		}
		case "issue":{
			$notfound=false;
			if ($_GET["issueid"]) {
				$issueid=$_GET["issueid"];
				$gameroot=$_CONFIG["pathtapes"].$issueid."/";
				$gamefile=$gameroot."tape.json";
				if (!is_file($gamefile)) $issueid=0;
				$loadeddata=json_decode(file_get_contents($gamefile),true);
				foreach ($data as $key => $value) $loadeddata[$key]=$value;
				$loadeddata["gameroot"]=$gameroot;
				$loadeddata["issueid"]=$issueid;
				echo fillTemplate(file_get_contents("templates/issue.html"),$loadeddata);
			}
			break;
		}
	}
}

if ($notfound) echo fillTemplate(file_get_contents("templates/home.html"),$data);
