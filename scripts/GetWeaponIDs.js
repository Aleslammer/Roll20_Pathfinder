on("chat:message", function(msg){
    if (msg.type=="api" && msg.content.indexOf("!GetWeaponIDs") == 0)
    {
        var chatMessage = "";
        function test(weapon)
        {
            if (weapon.get("name").includes("_name"))
            {
                index++;
                var myRowID = weapon.get("name").replace("repeating_weapon_", "").replace("_name", "");
                chatMessage += `\n--`+index+". "+weapon.get("current")+":| " + myRowID
                log(myRowID);
            }
        }

        var params = {}
        function parseArgs(args){
            for(lcv = 1; lcv < args.length; lcv++)
            {
                var splitValue = args[lcv].trim().split("|");
                var key = splitValue[0];
                var value = splitValue[1];
                params[key] = value;
            }
        }
        
        args = msg.content.split("--");

        // parse all the arguments
        parseArgs(args);
            
        const powerCardStart = "!power {{";
        const powerCardStop = "\n}}";
        chatMessage += powerCardStart;
        chatMessage += `\n--name|Weapon IDS`;
        chatMessage += `\n--leftsub|Weapon IDS on Sheet`
        chatMessage += `\n--rightsub|Nothing`
    
        var index = 0;
        var output = findObjs({type: 'attribute', characterid: params.characterID}).filter(x => x.get("name").includes("repeating_weapon_"))
        output.forEach(weapon => test(weapon));
        chatMessage += powerCardStop;
        log(chatMessage);
        sendChat("WeaponIDs", chatMessage);

    }
});