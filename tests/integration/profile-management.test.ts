import { describe, expect, it, vi } from 'vitest';
import { GameApp } from '../../src/app/app.js';
import type { AssetPack } from '../../src/contracts/asset-manifest.js';
import type { CloudPort, CloudSaveInput, GameProfile, StorageLike } from '../../src/contracts/index.js';
import { localSaveKeyForGame } from '../../src/persistence/index.js';
import { createHeroAnchorFixture, createManifestFixture } from './asset-fixtures.js';

const fetcher = async (url: string) => ({ ok: true, status: 200, json: async () => url.endsWith('/anchors.json') ? createHeroAnchorFixture() : createManifestFixture(url.split('/').at(-2) as AssetPack) });
class Storage implements StorageLike {
  values = new Map<string,string>();
  getItem(key:string):string|null { return this.values.get(key) ?? null; }
  setItem(key:string,value:string):void { this.values.set(key,value); }
  removeItem(key:string):void { this.values.delete(key); }
}
const flush = ():Promise<void> => new Promise((resolve)=>setTimeout(resolve,0));
async function seeded(storage = new Storage()):Promise<{app:GameApp;storage:Storage;id:string}> {
  const app = new GameApp({baseUrl:'./',fetcher,storage}); await app.initialize();
  app.dispatch({type:'newGame',payload:{name:'倉庫測試'}}); app.update(0); await flush();
  const id = app.state.profile!.activeCharacterId!;
  app.dispatch({type:'returnTitle',payload:{}}); app.update(0); await flush();
  expect(app.state.screen).toBe('title'); return {app,storage,id};
}

describe('profile changes through the app save pipeline',()=>{
  it('serializes duplicate commands, reloads inventory transfers and restores a deleted active character',async()=>{
    const {app,storage,id} = await seeded();
    const transfer = {type:'manageProfile',payload:{type:'transfer',characterId:id,from:'bag',index:0,itemId:'small-red',quantity:2}} as const;
    app.dispatch(transfer); app.dispatch(transfer); app.update(0); await flush();
    expect(app.state.profile!.warehouse).toEqual([{itemId:'small-red',quantity:2}]);
    expect(app.state.profile!.characters[id]!.player.bag[0]!.quantity).toBe(8);
    app.dispatch({type:'manageProfile',payload:{type:'rename',characterId:id,name:'更名後'}}); app.update(0); await flush();
    app.dispatch({type:'manageProfile',payload:{type:'delete',characterId:id,confirmation:'更名後'}}); app.update(0); await flush();
    expect(app.state.gameplay).toBeNull(); expect(app.state.profile!.deletedCharacter?.player.name).toBe('更名後');
    const raw = JSON.parse(storage.getItem(localSaveKeyForGame('brightwood-first-oath'))!);
    expect(raw.formatVersion).toBe(9); app.dispose();
    const restored = new GameApp({baseUrl:'./',fetcher,storage}); await restored.initialize();
    expect(restored.state.profile!.warehouse).toEqual([{itemId:'small-red',quantity:2}]);
    restored.dispatch({type:'manageProfile',payload:{type:'restore'}}); restored.update(0); await flush();
    restored.dispatch({type:'selectCharacter',payload:{characterId:id}}); restored.update(0); await flush();
    expect(restored.state.gameplay!.saveData.player).toMatchObject({name:'更名後',luk:0});
    expect(restored.state.gameplay!.saveData.player.bag[0]!.quantity).toBe(8); restored.dispose();
  });
  it('keeps the exact pending profile and requestId on a failed cloud save, blocking further transfers until retry',async()=>{
    const seed = await seeded(); const profile = structuredClone(seed.app.state.profile!) as GameProfile; seed.app.dispose();
    const writes:CloudSaveInput[]=[];
    const cloud:CloudPort={
      ready:async()=>({mode:'authenticated',progressAvailable:true,capabilities:['progress']}),
      loadProgress:async()=>({data:profile,revision:4,formatVersion:9,gameVersion:'test',updatedAt:'test'}),
      saveProgress:vi.fn(async(input)=>{writes.push(structuredClone(input));if(writes.length===1)throw Error('response lost');return {...input,saved:true,revision:5,gameVersion:'test',updatedAt:'test'};}),
    };
    const app=new GameApp({baseUrl:'./',fetcher,cloud});await app.initialize();
    const transfer={type:'manageProfile',payload:{type:'transfer',characterId:seed.id,from:'bag',index:0,itemId:'small-red',quantity:2}} as const;
    app.dispatch(transfer);app.update(0);await flush();expect(app.state.saveStatus).toBe('saveError');
    const pending=structuredClone(app.state.profile);
    app.dispatch(transfer);app.update(0);await flush();expect(app.state.profile).toEqual(pending);expect(writes).toHaveLength(1);
    app.dispatch({type:'retrySave',payload:{}});app.update(0);await flush();
    expect(app.state.saveStatus).toBe('saved');expect(writes).toHaveLength(2);expect(writes[1]).toEqual(writes[0]);app.dispose();
  });
});
