// with a bunch of help from many people in the Foundry VTT dnd5e#MidiQOL channel
// including @thatlonelybugbear#4393 and @Chris#8375, among others
/////

export class Wand {
    static suppressDialog(onUseWorkflow) {
        onUseWorkflow.config.consumeUsage = false;
        onUseWorkflow.config.needsConfiguration = false;
        onUseWorkflow.options.configureDialog = false;
    }

    static async use(onUseWorkflow) {
        const charges = onUseWorkflow.item.system.uses.value;

        if (charges === 0) {
            ui.notifications.error("You have no remaining charges.");
            return;
        }

        
        async function dialogAsync(){
            let content = `<center>How many charges would you like to use?<br/><i>(${charges} available)</i></center><br/>`;
            content += '<center><form><select name="charges" id="choose">';
            Array.fromRange(charges).forEach(charge => content += `<option value="${(Number(charge)+1)}">${(Number(charge)+1)}</option>`);
            content += '</select></form></center><br/>';
            const dialogOptions = {
                width: 300
            }
            return await new Promise(async (resolve) => {
                new Dialog({
                    title : `${onUseWorkflow.item.name}`, 
                    content,
                    buttons: {
                        use: {label: "Use", icon: '<i class="fa-duotone fa-wand-sparkles"></i>', callback: () => {
                            resolve(choose.value);
                        }}
                    },
                    default: 'use'
                }, dialogOptions).render(true);
            })
        }
        let castLevel = await dialogAsync();
        onUseWorkflow.castData.castLevel = Number(castLevel);
        await onUseWorkflow.item.update({"system.uses.value": charges - castLevel});
        await this.#expend(onUseWorkflow);
    }   

    static async #expend(onUseWorkflow) {
        var wandFlavor = '';
        if (onUseWorkflow.item.system.uses.value === 0) {
            wandFlavor = `using all charges of the ${onUseWorkflow.item.name}`;
            var wandCheck = new Roll("1d20");
            await wandCheck.evaluate();
            if (wandCheck.total === 1) {
                wandFlavor = wandFlavor + ` and it disentegrates to dust`
                await onUseWorkflow.item.delete();
            }
        } else {
            const plural = onUseWorkflow.castData.castLevel > 1 ? 's' : '';
            wandFlavor = `using ${onUseWorkflow.castData.castLevel} charge${plural} of the ${onUseWorkflow.item.name}`;
        }

        const chatMessage = game.messages.get(onUseWorkflow.itemCardId);
        var content = duplicate(chatMessage.content);
        const searchString =  `<div class="end-midi-qol-hits-display"></div>`;
        const replaceString = `<div class="end-midi-qol-hits-display" style="padding: 7px;">${wandFlavor}</div>`;
        content = content.replace(searchString, replaceString);
        await chatMessage.update({content: content});
    }
}