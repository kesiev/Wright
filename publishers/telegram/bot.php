<?php

/*
 *  $_SECRET=[
 *     "siteRoot"=>"<site root>", // Site root (i.e. https://www.kesiev.com/wright/)
 *     "botId"=>"<bot id>", // Bot ID, generated via BotFather
 *     "encryptKey"=>"<some random letters>", // Your URL encryption keys
 *     "encryptIv"=>"<8 random letters>" // Your URL encryption keys
 * ];
 *
 * Remember to register your bot opening in a browser...
 * https://api.telegram.org/bot<bot id>/setWebhook?url=<site root>/publishers/telegram/bot.php
 */

include "secret.php";

$_CONFIG=Array(
    "botName"=>"WrightMagBot", // Name of the bot
    "pageSize"=>4, // Size of list pages
    "inlineResultsSize"=>4, // Size of inline search results (i.e. @wrightmagbot starcat)
    "database"=>"../database.json", // Position of game database
    "gamesRoot"=>$_SECRET["siteRoot"]."publishers/telegram/game.html?game=", // Game launcher URL
    "siteRoot"=>$_SECRET["siteRoot"]."issue/", // Issue page
    "issuesRoot"=>$_SECRET["siteRoot"]."issues/", // Issues page
    "welcomeMessage"=>"\xF0\x9F\x8E\xAE *Welcome to Wright! Magazine!* \xF0\x9F\x8E\xAE\n\nI'm [KesieV](https://www.kesiev.com) and I write ramblings about videogames in my spare time, shipping every one of them with a related heavily retro-styled videogame written from scratch you can play. Everything, from the articles to the game engine and every single game is [open sourced](https://github.com/kesiev/wright), so you can see how I'm making them if you're curious.\nI usually use [Twitter](http://www.twitter.com/KesieV) for announcing new games so, if you want to stay up-to-date, just follow me.\n\nThis chatbot can help you on browsing the games catalogue and play them against your friends!\nYou can also play games while chatting with your friends summoning me sending a message with `@WrightMagBot <name of the game>`.\n\nRemember that you can read the Wright! Magazine articles and play other games on the [project homepage](https://www.kesiev.com/wright)!\n\n_PS: Telegram limits the number of games you can have to 20. There are more_ [on the project page](https://www.kesiev.com/wright) _but you'll find them here and challenge your friends when (if?) this policy will change._",
    "listAllGames"=>"\xF0\x9F\x93\x91 List all games",
    "latestGames"=>"\xF0\x9F\x86\x95 Latest games",
    "cantUnderstand"=>"Uhm. \xF0\x9F\x98\x85 I can't understand your command... Can I suggest a random game for you?",  
    "cantFind"=>"\xF0\x9F\x98\x92 I can't find the specified game. Can I suggest a random game for you?",
    "cantPlay"=>"\xF0\x9F\x98\x85 Sorry, *{gameLabel}* can't be played on Telegram right now. But... Hey! You can still play it \xF0\x9F\x8E\xAE [with your web browser]({gameUrl})!",
    "groupNotify"=>"Hey! I can help you challenge your friends on some retrogames! Chat directly with @WrightMagBot, choose a game and *Share* it with this group. See you there!",
    "newGameEmoji"=>"\xF0\x9F\x92\xA5",
    "playEmoji"=>"\xF0\x9F\x8E\xAE"
);

/*
 * Telegram interface
 */

function telegramGetScoreData($telegram,$data) {
    global $_SECRET;
    $cipher = mcrypt_module_open(MCRYPT_BLOWFISH,'','cbc','');
    mcrypt_generic_init($cipher, $_SECRET["encryptKey"], $_SECRET["encryptIv"]);
    $telegram["score_data"]=trim(mdecrypt_generic($cipher,base64_decode(str_replace(Array("_",".","-"),Array("=","+","/"),$data))));
    $decrypt=@json_decode($telegram["score_data"],true);
    if ($decrypt) {
        $telegram["score_user_id"]=$decrypt["score_user_id"];
        $telegram["score_message_id"]=$decrypt["score_message_id"];    
        $telegram["score_chat_id"]=$decrypt["score_chat_id"];    
        $telegram["score_inline_message_id"]=$decrypt["score_inline_message_id"];    
    }
    return $telegram;
}

function telegramGenerateScoreData($telegram) {
    global $_SECRET;
    if ($telegram["callback_query_message_id"])
        $data = json_encode(Array(
            "score_user_id"=>$telegram["callback_query_user_id"],
            "score_message_id"=>$telegram["callback_query_message_id"],
            "score_chat_id"=>$telegram["callback_query_message_chat_id"],
            "score_inline_message_id"=>""
        ));
    else 
        $data = json_encode(Array(
            "score_user_id"=>$telegram["callback_query_user_id"],
            "score_message_id"=>"",
            "score_chat_id"=>"",
            "score_inline_message_id"=>$telegram["callback_query_inline_message_id"]
        ));
    $cipher = mcrypt_module_open(MCRYPT_BLOWFISH,'','cbc','');
    mcrypt_generic_init($cipher, $_SECRET["encryptKey"], $_SECRET["encryptIv"]);
    return str_replace(Array("=","+","/"), Array("_",".","-"),base64_encode(mcrypt_generic($cipher,$data)));
}

function telegramGet($botId) {
    if (isset($_SERVER["HTTP_SCOREDATA"])) {
        $score=$_POST["score"]*1;
        if ($score>=0) {
            $ret=Array("botId"=>$botId,"score"=>$score);
            $ret=telegramGetScoreData($ret,$_SERVER["HTTP_SCOREDATA"]);
        }
    } else {
        $data = file_get_contents("php://input");
        $data=json_decode($data, true);
        $ret=Array(
            "botId"=>$botId,
            "chatId"=>$data["message"]?$data["message"]["chat"]["id"]:"",
            "text"=>$data["message"]?$data["message"]["text"]:"",
            "fromGroup"=>$data["message"]&&isset($data["message"]["chat"])?$data["message"]["chat"]["type"]=="group":"",
            "inline_query"=>$data["inline_query"]?$data["inline_query"]["query"]:"",
            "inline_query_id"=>$data["inline_query"]?$data["inline_query"]["id"]:"",
            "callback_query_message_id"=>$data["callback_query"]?$data["callback_query"]["message"]["message_id"]:"",
            "callback_query_user_id"=>$data["callback_query"]?$data["callback_query"]["from"]["id"]:"",
            "callback_query_message_chat_id"=>$data["callback_query"]?$data["callback_query"]["message"]["chat"]["id"]:"",
            "callback_query_inline_message_id"=>$data["callback_query"]?$data["callback_query"]["inline_message_id"]:"",
            "callback_query_id"=>$data["callback_query"]?$data["callback_query"]["id"]:"",
            "callback_query_game_short_name"=>$data["callback_query"]?$data["callback_query"]["game_short_name"]:""
        );
    }
    return $ret;
}

function telegramCall($telegram, $apiCall, $data, $post = true) {
	$url='https://api.telegram.org/bot'.$telegram["botId"].'/'.$apiCall;
    if (isset($telegram["chatId"])) $url .= "?chat_id=" . $telegram["chatId"];
    $params = array('http' => array(
          'method' => 'POST',
          'content' => http_build_query($data)
        ));
    $ctx = stream_context_create($params);
    $fp = @fopen($url, 'rb', false, $ctx);
    $result = @stream_get_contents($fp);
    return json_decode($result,true);
}

function sendText($t,$text,$buttons=0,$onetime=true) {
    $reply=Array(
        "chat_id"=>$t["chatId"],
        "parse_mode"=>"markdown",
        "text"=>$text
    );
    if ($buttons=="clear") {
         $reply["reply_markup"]=json_encode(Array(
            'hide_keyboard' => true
        ));
    } else if ($buttons) {
        $keyboard=Array();
        for ($i=0;$i<count($buttons);$i++)
            array_push($keyboard,Array($buttons[$i]));
        $reply["reply_markup"]=json_encode(Array(
            'keyboard' => $keyboard, 
            'resize_keyboard' => true, 
            'one_time_keyboard' => $onetime
        ));
    }
    telegramCall($t,"sendMessage",$reply);
}

function sendGame($t,$game) {
    global $_CONFIG;
    telegramCall($t,"sendGame",Array(
        "chat_id"=>$t["chatId"],
        "game_short_name"=>$game["onTelegram"],
        "reply_markup"=>json_encode(Array(
            "inline_keyboard"=>Array(
                Array(
                    Array("text"=>"Play solo","callback_game"=>json_encode(Array("game_short_name"=>$game["onTelegram"]))),
                    Array("text"=>"Share","url"=>"https://telegram.me/".$_CONFIG["botName"]."?game=".$game["onTelegram"])
                ),
                Array(
                    Array("text"=>"Read article","url"=>$_CONFIG["siteRoot"].$game["id"])
                )
            )
        ))
    ));
}

/*
 * Chatbot
 */

function cleanText($text){
  return trim(preg_replace('/([0-9#][\x{20E3}])|[\x{00ae}\x{00a9}\x{203C}\x{2047}\x{2048}\x{2049}\x{3030}\x{303D}\x{2139}\x{2122}\x{3297}\x{3299}][\x{FE00}-\x{FEFF}]?|[\x{2190}-\x{21FF}][\x{FE00}-\x{FEFF}]?|[\x{2300}-\x{23FF}][\x{FE00}-\x{FEFF}]?|[\x{2460}-\x{24FF}][\x{FE00}-\x{FEFF}]?|[\x{25A0}-\x{25FF}][\x{FE00}-\x{FEFF}]?|[\x{2600}-\x{27BF}][\x{FE00}-\x{FEFF}]?|[\x{2900}-\x{297F}][\x{FE00}-\x{FEFF}]?|[\x{2B00}-\x{2BF0}][\x{FE00}-\x{FEFF}]?|[\x{1F000}-\x{1F6FF}][\x{FE00}-\x{FEFF}]?/u', '', $text));
}

function randomGameLabel($database) {
    global $_CONFIG;
    $random_key = array_rand($database["available"]);
    return ($random_key==0?$_CONFIG["newGameEmoji"]:$_CONFIG["playEmoji"])." Play ".$database["available"][$random_key]["label"];
}

$t = telegramGet($_SECRET["botId"]);

if ($t["score_user_id"]) {
    // Score update
    if ($t["score_inline_message_id"])
        telegramCall($t,"setGameScore",Array(
            "user_id"=>$t["score_user_id"],
            "score"=>$t["score"],
            "inline_message_id"=>$t["score_inline_message_id"],
        ));    
    else
        telegramCall($t,"setGameScore",Array(
            "user_id"=>$t["score_user_id"],
            "score"=>$t["score"],
            "message_id"=>$t["score_message_id"],
            "chat_id"=>$t["score_chat_id"],
        ));    
} else if ($t["callback_query_game_short_name"]) {
    // Game open request
    telegramCall($t,"answerCallbackQuery",Array(
        "callback_query_id"=>$t["callback_query_id"],
        "url"=>$_CONFIG["gamesRoot"].$t["callback_query_game_short_name"]."&scoredata=".urlencode(telegramGenerateScoreData($t))
    ));    
} else {
    // Load database
    $line=strtolower(cleanText($t["text"]));
    $alldatabase=json_decode(file_get_contents($_CONFIG["database"]),true);
    $database=Array(
        "available"=>Array(),
        "byLabel"=>Array()
    );
    for ($i=0;$i<count($alldatabase);$i++) {
        $database["byLabel"][strtolower($alldatabase[$i]["label"])]=$alldatabase[$i];
        if (isset($alldatabase[$i]["onTelegram"])) array_push($database["available"], $alldatabase[$i]);
    }

    if ($t["inline_query"]) {
        // Inline query support (i.e. @wrightmagbot starcat)
        $query=strtolower(cleanText($t["inline_query"]));
        $results=Array();
        for ($i=0;$i<count($database["available"]);$i++) 
            if (strpos(strtolower($database["available"][$i]["label"]), $query)!==false) {
                array_push($results,Array(
                    "type"=>"game",
                    "id"=>$database["available"][$i]["id"],
                    "game_short_name"=>$database["available"][$i]["onTelegram"]
                ));
                if (count($results)==$_CONFIG["inlineResultsSize"]) break;
            }
        telegramCall($t,"answerInlineQuery",Array(
            "inline_query_id"=>$t["inline_query_id"],
            "results"=>json_encode($results)
        ));    
    } else if ($t["text"]) {
        // Chatbot
        if ($t["fromGroup"])
            sendText($t,$_CONFIG["groupNotify"],"clear");
        else if (substr($line,0,5)=="play ") {
            $label=trim(substr($line,5));
            $found=false;
            if (isset($database["byLabel"][$label]))
                if (isset($database["byLabel"][$label]["onTelegram"]))
                    sendGame($t,$database["byLabel"][$label]);
                else {
                    $text=preg_replace("/\\{gameLabel\\}/", $database["byLabel"][$label]["label"], $_CONFIG["cantPlay"]);
                    $text=preg_replace("/\\{gameUrl\\}/", $_CONFIG["siteRoot"].$database["byLabel"][$label]["id"], $text);
                    sendText($t,$text,Array($_CONFIG["listAllGames"]));
                }
            else
                sendText($t,$_CONFIG["cantFind"],Array(randomGameLabel($database),$_CONFIG["listAllGames"]));
        } else if ((substr($line,0,4)=="list")||(substr($line,0,4)=="page")||(substr($line,0,6)=="latest")) {
            $page=0;
            $pages=floor(count($database["available"])/$_CONFIG["pageSize"]);
            $args=preg_split("/ /", $line);
            if (count($args)>1) $page=$args[1]-1;
            if (!$page||($page<0)) $page=0;
            $first=$page*$_CONFIG["pageSize"];
            if ($first>=count($database["available"])) {
                $page=$pages;
                $first=$page*$_CONFIG["pageSize"];
            }
            if ($first<0) { $first=0; $page=0; }
            $list=Array($_CONFIG["latestGames"]);
            if ($page>0) array_push($list, "\xE2\x86\xA9 Page ".$page);
            for ($i=0;$i<$_CONFIG["pageSize"];$i++) {
                $pos=$first+$i;
                if ($pos<count($database["available"]))
                    array_push($list, ($pos==0?$_CONFIG["newGameEmoji"]:$_CONFIG["playEmoji"])." Play ".$database["available"][$pos]["label"]);
                else break;
            }
            if ($first+$_CONFIG["pageSize"]<count($database["available"])) array_push($list, "\xE2\x86\xAA Page ".($page+2));
            sendText($t,"\xF0\x9F\x93\x91 This is *page ".($page+1)." of ".($pages+1)."*.\n\xF0\x9F\x8E\xAE *".count($database["available"])." games of ".count($alldatabase)."* are playable on Telegram right now. More [here](".$_CONFIG["issuesRoot"].")." ,$list,false);
        } else switch ($line) {
        	case "/start":{
        		sendText($t,$_CONFIG["welcomeMessage"],Array(randomGameLabel($database),$_CONFIG["listAllGames"]));
        		break;
        	}
            default:{
                sendText($t,$_CONFIG["cantUnderstand"],Array(randomGameLabel($database),$_CONFIG["listAllGames"]));
                break;
            }
        }
    }
}