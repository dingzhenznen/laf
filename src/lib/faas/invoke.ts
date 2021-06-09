import { FunctionEngine, scheduler } from "."
import { db } from '../../lib/db'
import { LocalFileStorage } from "../storage/local_file_storage"
import request from 'axios'
import Config from "../../config"
import { CloudFunctionStruct, CloudSdkInterface, FunctionContext, InvokeFunctionType } from "./types"

/**
 * 创建云函数 cloud sdk
 * @returns 
 */
function createCloudSdk(): CloudSdkInterface {

  // 云函数中调用云函数的接口
  const invoke: InvokeFunctionType = async (name, param) => {
    const func = await getCloudFunction(name)
    if (!func) {
      throw new Error(`invoke() failed to get function: ${name}`)
    }

    if (param?.method) {
      param.method = param.method ?? 'call'
    }
    const result = await invokeFunction(func, param ?? { method: 'call' })

    // 将云函数调用日志存储到数据库
    {
      result.logs.unshift(`invoked in function: ${func.name} (${func._id})`)
      await db.collection('function_logs')
        .add({
          requestId: `func_${func._id}`,
          func_id: func._id,
          func_name: func.name,
          logs: result.logs,
          time_usage: result.time_usage,
          created_at: Date.now(),
          updated_at: Date.now(),
          created_by: `${func._id}`
        })
    }

    return result
  }

  const less: CloudSdkInterface = {
    database: () => db,
    storage: (namespace: string) => new LocalFileStorage(Config.LOCAL_STORAGE_ROOT_PATH, namespace),
    fetch: request,
    invoke,
    emit: (event: string, param: any) => scheduler.emit(event, param)
  }

  return less
}

/**
 * 调用云函数
 */
export async function invokeFunction(func: CloudFunctionStruct, param: FunctionContext) {
  const { query, body, auth, requestId } = param
  const engine = new FunctionEngine()
  const result = await engine.run(func.code, {
    requestId,
    functionName: func.name,
    query: query,
    body: body,
    auth: auth,
    extra: param.extra,
    method: param.method,
    less: createCloudSdk()
  })

  return result
}


/**
 * 获取云函数
 * @param func_name 
 * @returns 
 */
export async function getCloudFunction(func_name: string): Promise<CloudFunctionStruct> {
  // 获取函数
  const r = await db.collection('functions')
    .where({ name: func_name })
    .getOne()

  if (!r.ok) {
    throw new Error(`getCloudFunction() failed to get function [${func_name}]: ${r.error.toString()}`)
  }

  return r.data
}

/**
 * 获取云函数 by id
 * @param func_name 
 * @returns 
 */
export async function getCloudFunctionById(func_id: string): Promise<CloudFunctionStruct> {
  // 获取函数
  const r = await db.collection('functions')
    .where({ _id: func_id })
    .getOne()

  if (!r.ok) {
    throw new Error(`getCloudFunctionById() failed to get function [${func_id}]: ${r.error.toString()}`)
  }

  return r.data
}