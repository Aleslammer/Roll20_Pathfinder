on("ready", function () {
    var version = '0.1.0';
	log("-=> PF_MeleeAmos v" + version + " Loaded ");
});

on("chat:message", function(msg){
    if (msg.type=="api" && msg.content.indexOf("!PF_MeleeAmos") == 0)
    {
        const showLog = false;

        var chatMessage = "";
        var params = {};
        var values = {};
        function parseArgs(args){
            for(lcv = 1; lcv < args.length; lcv++)
            {
                var splitValue = args[lcv].trim().split("|");
                var key = splitValue[0];
                var value = splitValue[1];
                params[key] = value;
            }
        }

        function logMessage(message, override = false)
        {
            if (showLog || override)
            {
                log(message)
            }
        }

        args = msg.content.split("--");

        function getCharacterInfo(characterID)
        {
            values["characterName"] = getAttrByName(characterID, "character_name");
            values["swiftAction"] = getAttrByName(characterID, "swiftAction")
            values["intimidate"] = parseInt(getAttrByName(characterID, "Intimidate-ranks")) + parseInt(getAttrByName(characterID, "Intimidate-misc"))            
            var player_obj = getObj("player", msg.playerid);
            values["bgColor"] =  player_obj.get("color");
        }

        function getTargetInfo(targetTokenID)
        {
            var token = findObjs({ type: 'graphic', _id: targetTokenID })[0];
            values["targetName"] = "Something";
            if (token)
            {
                values["targetName"] = token.get("name");
                values["targetAC"] = parseInt(token.get("bar2_value"));
            }

        }

        function getWeaponValue(characterID, weaponID, name, defaultValue)
        {
            var attrName = "repeating_weapon_"+weaponID+"_"+name;
            var myRow = findObjs({ type: 'attribute', characterid: characterID, name: attrName })[0]
            if (myRow)
            {
                return myRow.get("current");
            }
            else
            {
                logMessage("Missing Row for " + attrName + " Using default of " + defaultValue);
                return defaultValue;
            }
        }

        function getWeaponInfo(characterID, weaponID)
        {
            values["weaponName"] = getWeaponValue(characterID, weaponID, "name", "Unknown");
            values["weaponType"] = getWeaponValue(characterID, weaponID, "type", "Unknown");
            values["weaponNotes"] = getWeaponValue(characterID, weaponID, "notes");
            values["critTarget"] = getWeaponValue(characterID, weaponID, "crit-target", 20);
            values["attackBonus"] = " [ToAtk]" + getWeaponValue(characterID, weaponID, "attack");

            values["attackBonus"] += " + [Misc]" + params.miscAtkBonus
            values["damageDiceNum"] = getWeaponValue(characterID, weaponID, "damage-dice-num", 1);
            values["damageDice"] = getWeaponValue(characterID, weaponID, "damage-die");
            values["damageBonus"] = getWeaponValue(characterID, weaponID, "damage", 0);
            values["critMultiplier"] = getWeaponValue(characterID, weaponID, "crit-multiplier", 1);
            values["damageRoll"] = values.damageDiceNum + "d" + values.damageDice + " + [Bonus]" + values.damageBonus
            values["damageRoll"] += " + [Misc] " + params.miscDamage

            values["critDamageRoll"] = (values.damageDiceNum * values.critMultiplier) + "d" + values.damageDice + " + [Bonus]" + ((values.damageBonus + params.miscDamage) * values.critMultiplier)
        }

        function validateIntArgs()
        {
            params.miscDamage = parseInt(params.miscDamage);
            if (isNaN(params.miscDamage)) { params.miscDamage = 0; }
            params.miscAtkBonus = parseInt(params.miscAtkBonus);
            if (isNaN(params.miscAtkBonus)) { params.miscAtkBonus = 0; }
        }

        // parse all the arguments
        parseArgs(args);
        logMessage(params);

        validateIntArgs();
        getCharacterInfo(params.characterID);
        getTargetInfo(params.targetTokenID);
        getWeaponInfo(params.characterID, params.weaponID);

        logMessage(values);

        var lowerSwift = false;
        const powerCardStart = "!power {{";
        const powerCardStop = "\n}}";
        chatMessage += powerCardStart;
        chatMessage += `\n--name|${values.characterName} attacks ${values.targetName} with ${values.weaponName}!`;
        chatMessage += `\n--bgcolor|${values.bgColor}`;
        chatMessage += `\n--leftsub|${values.weaponType}`;
        chatMessage += `\n--rightsub|${values.weaponNotes}`;
        chatMessage += `\n--!showpic|[x](https://64.media.tumblr.com/0ceb939f8eb94552c6e8c65684df203a/tumblr_inline_p8qbt6m97V1rqrjnu_640.gif)`;
        chatMessage += `\n--Attack|[[ [$atk] 1d20cs>${values.critTarget}+${values.attackBonus}]]`;
        chatMessage += `\n--?? $atk.base == 1 OR $atk.total < ${values.targetAC} ?? !Miss:|${values.characterName} missed!`;
        chatMessage += `\n--?? $atk.base > 1 AND $atk.total >= ${values.targetAC} AND $atk.base < ${values.critTarget} ?? Damage|[[ [$dmg] ${values.damageRoll}]]`;
        chatMessage += `\n--?? $atk.base >= ${values.critTarget} ?? Confirm Critical Hit|Roll: [[ [$crt] 1d20cs>${values.critTarget}+${values.attackBonus}]]`;
        chatMessage += `\n--?? $atk.base >= ${values.critTarget} AND $crt.base > 1 AND $crt.total >= ${values.targetAC} ?? Critical Damage|[[ [$crtdmg] ${values.critDamageRoll}]]`;
        chatMessage += `\n--?? $atk.base >= ${values.critTarget} AND $crt.base == 1 OR $crt.total < ${values.targetAC} ?? Damage|[[ [$dmg2] ${values.damageRoll}]]`;
        if (values.swiftAction > 0)
        {
            lowerSwift = true;
            chatMessage += `\n--?? $atk.base > 1 AND $atk.total >= ${values.targetAC} ?? Intimidate|[[1d20 + ${values.intimidate}]]`;
            chatMessage += `\n--?? $atk.base > 1 AND $atk.total >= ${values.targetAC} ?? api_setattr|_name ${values.characterName} _swiftAction|${values.swiftAction -1} _silent`
            chatMessage += `\n--?? $atk.base > 1 AND $atk.total >= ${values.targetAC} ?? Hurtful Attack|[[ [$hrt] 1d20cs>${values.critTarget}+${values.attackBonus}]]`
            chatMessage += `\n--?? $atk.base > 1 AND $atk.total >= ${values.targetAC} AND $hrt.base > 1 AND $hrt.total >= ${values.targetAC} AND $hrt.base < ${values.critTarget} ?? Hurtful Damage|[[ [$hrtdmg] ${values.damageRoll}]]`
            chatMessage += `\n--?? $atk.base > 1 AND $atk.total >= ${values.targetAC} AND $hrt.base >= ${values.critTarget} ?? Confirm Hurtful Critical Hit|Roll: [[ [$hcrt] 1d20cs>${values.critTarget}+${values.attackBonus}]]`
            chatMessage += `\n--?? $atk.base > 1 AND $atk.total >= ${values.targetAC} AND $hrt.base >= ${values.critTarget} AND $hcrt.total >= ${values.targetAC} ?? Hurtful Critical Damage|[[ [$hrtcrtdmg] ${values.critDamageRoll}]]`
            chatMessage += `\n--?? $atk.base > 1 AND $atk.total >= ${values.targetAC} AND $hrt.base >= ${values.critTarget} AND $hcrt.total < ${values.targetAC} ?? Hurtful Damage|[[ [$hrtdmg2] ${values.damageRoll}]]`
        }

        chatMessage += `\n--?? $atk.base > 1 AND $atk.total >= ${values.targetAC} ?? vfx_opt|${params.targetTokenID} ${params.characterTokenID} splatter-blood`
    
        if ("applyDamage" in params)
        {
            chatMessage += `\n--?? $atk.base > 1 AND $atk.total >= ${values.targetAC} AND $atk.base < ${values.critTarget} ?? alterbar1|_target|${params.targetTokenID} _bar|1 _amount|-[^dmg]`;
            chatMessage += `\n--?? $atk.base >= ${values.critTarget} AND $crt.base == 1 OR $crt.total < ${values.targetAC} ?? alterbar2|_target|${params.targetTokenID} _bar|1 _amount|-[^dmg2]`;
            chatMessage += `\n--?? $atk.base >= ${values.critTarget} AND $crt.base > 1 AND $crt.total >= ${values.targetAC} ?? alterbar3|_target|${params.targetTokenID} _bar|1 _amount|-[^crtdmg]`;
            chatMessage += `\n--?? $atk.base > 1 AND $atk.total >= ${values.targetAC} AND $hrt.base > 1 AND $hrt.total >= ${values.targetAC} AND $hrt.base < ${values.critTarget} ?? alterbar4|_target|${params.targetTokenID} _bar|1 _amount|-[^hrtdmg]`;
            chatMessage += `\n--?? $atk.base > 1 AND $atk.total >= ${values.targetAC} AND $hrt.base >= ${values.critTarget} AND $hcrt.total < ${values.targetAC} ?? alterbar5|_target|${params.targetTokenID} _bar|1 _amount|-[^hrtdmg2]`;
            chatMessage += `\n--?? $atk.base > 1 AND $atk.total >= ${values.targetAC} AND $hrt.base >= ${values.critTarget} AND $hcrt.total >= ${values.targetAC} ?? alterbar6|_target|${params.targetTokenID} _bar|1 _amount|-[^hrtcrtdmg]`;
        }

        chatMessage += powerCardStop;
        logMessage(chatMessage);
        sendChat(values.characterName, chatMessage);
    }
});