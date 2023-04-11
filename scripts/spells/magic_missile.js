// extended from the magic missile sequencer example at https://wasp0r.itch.io/sequencer
/////

export class MagicMissile {
    static #magicMissileEffect(number, target) {
        return new Sequence()
        .effect()
            .atLocation(canvas.tokens.controlled[0])
            .stretchTo(canvas.tokens.get(target))
            .file("jb2a.magic_missile")
            .repeats(number, 300, 600)
            .randomizeMirrorY()
        .play();
    }

    static async cast(onUseWorkflow, castLevel = onUseWorkflow.castData.castLevel) {
        let numTargets = onUseWorkflow.hitTargets.size;
        let numMissiles = 2 + castLevel;
        let targetMissiles = new Map();
        let actor = canvas.tokens.controlled[0].actor;
        let roundRobin = actor.getFlag('w15ps-srd', 'roundRobin');
        if ((roundRobin === undefined || !roundRobin) && numTargets > 1 && numMissiles > numTargets) {
            async function targetDialog(){
                let targets = new Map();
                Array.from(onUseWorkflow.hitTargets).map(t => targets.set(t.id, [t.document.name, t.document.texture.src])); // id -> [tokenName, tokenImg]
                let content = `<center>Choose how many missiles to apply to each target<br/><i>(${numMissiles} available)</i></center>
                    <form class="flexcol"><table style="width: 100%; border: none"><tbody>`;
                targets.forEach((v, k) => {
                    content += `<tr><td align="center"><img src="${v[1]}" width="50px" style="border: 0px" /></td>
                        <td style="white-space:nowrap; vertical-align:center;">${v[0]}</td>
                        <td style="horizontal-align:center;"><select id="${k}_">`;
                    Array.fromRange(numMissiles).forEach(missile => content += `<option value="${(Number(missile)+1)}">${(Number(missile)+1)}</option>`);
                    content += '</select></td></tr>';
                });
                content += '</tbody></table></form>';
                const dialogOptions = {
                    width: 350,
                    height: 155 + numTargets * 55 // 150 + padding: 5 + numTargets * (height of token img + padding: 5) // FIXME should be parameterized
                }
                return await new Promise(async (resolve) => {
                    new Dialog({
                        title : `${onUseWorkflow.item.name}`, 
                        content,
                        buttons: {
                            cast: {label: "Cast", icon: '<i class="fa-regular fa-sparkles"></i>', callback: () => {
                                targets.forEach((v, k) => {
                                    if (numMissiles === 0) {ui.notifications.warn('Magic Missile: More missiles assigned to targets than available. Available missiles were applied in targeting order')}
                                    let missiles = Math.min(numMissiles, Number(document.getElementById(k + '_').value));
                                    numMissiles -= missiles;
                                    targetMissiles.set(k, missiles)
                                });
                                resolve();
                            }}
                        },
                        default: 'cast'
                    }, dialogOptions).render(true);
                })
            }
            await targetDialog();
        } else {
            // evenly distribute as many magic missiles as possible
            Array.from(onUseWorkflow.hitTargets).map(t => targetMissiles.set(t.id, Math.floor(numMissiles / numTargets)));
            // distribute the remaining magic missile in targeting order
            Array.from(onUseWorkflow.hitTargets).slice(0, numMissiles % numTargets).map(t => targetMissiles.set(t.id, targetMissiles.get(t.id)+1));
        }

        // the fanciness
        targetMissiles.forEach((v, k) => this.#magicMissileEffect(v, k));

        // this is inelegant, but works
        onUseWorkflow.damageList.forEach(t => t.totalDamage = t.totalDamage * targetMissiles.get(t.tokenId));
        onUseWorkflow.damageList.forEach(t => t.appliedDamage = t.appliedDamage * targetMissiles.get(t.tokenId));
        onUseWorkflow.damageList.forEach(t => t.hpDamage = t.appliedDamage);
        onUseWorkflow.damageList.forEach(t => t.damageDetail[0][0].damage = t.damageDetail[0][0].damage * targetMissiles.get(t.tokenId));
        onUseWorkflow.damageList.forEach(t => t.newHP = t.oldHP - t.appliedDamage);
    }
}