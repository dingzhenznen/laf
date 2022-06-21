
import { program } from 'commander'
import {appList,appStop,appStart,appRestart} from './api/apps'

import * as Table  from 'cli-table2'


program
.command('list')
.action(async () => {
    const response = await appList()

    if(response.data){
        const table = new Table({
            head: ['APPId', 'name','status'],
        });
    
        response.data.created.forEach(app => {
            table.push([app.appid,app.name,app.status])
        });

        response.data.joined.forEach(app => {
            table.push([app.appid,app.name,app.status])
        });

        console.log(table.toString())
    }

});

program
.command('stop <appid>')
.option('--env <env-file>', `the file name to generate`, '.env')
.action(async (appid) => {

    const response = await appStop(appid)

    if(response.data.result){
        console.log('stop success')
    }else{
        console.log('stop failed')
    }
});


program
.command('start <appid>')
.option('--env <env-file>', `the file name to generate`, '.env')
.action(async (appid) => {
    
    const response = await appStart(appid)

    if(response.data.result){
        console.log('start success')
    }else{
        console.log('start failed')
    }
});


program
.command('restart <appid>')
.option('--env <env-file>', `the file name to generate`, '.env')
.action(async (appid) => {

    const response = await appRestart(appid)


    if(response.data.result){
        console.log('restart success')
    }else{
        console.log('restart failed')
    }
});

program.parse(process.argv);
