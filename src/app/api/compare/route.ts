import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const { standard_url, actual_url, side_name } = await request.json();

    if (!standard_url || !actual_url) {
      return NextResponse.json(
        { error: '请提供标样和首件图片' },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // Build image URLs - use absolute URLs for the vision model
    const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'localhost:5000';
    const protocol = baseUrl.startsWith('http') ? '' : 'https://';
    const standardFullUrl = standard_url.startsWith('http') ? standard_url : `${protocol}${baseUrl}${standard_url}`;
    const actualFullUrl = actual_url.startsWith('http') ? actual_url : `${protocol}${baseUrl}${actual_url}`;

    const systemPrompt = `你是一个化妆品生产过程的首件核对专家。你的任务是对比标样图片和首件实物图片，判断它们是否一致。

请从以下几个方面进行对比：
1. 颜色：整体颜色、色调是否一致
2. 外观：形状、大小、表面质感是否一致
3. 标识：文字、图案、logo是否一致
4. 缺陷：首件是否有划痕、污渍、变形等缺陷

注意：
- 批号信息是变动的，不作为比对依据，请忽略批号差异
- 拍摄角度、光线差异导致的细微差别不应判定为不通过
- 只有明显的颜色、外观、标识差异才判定为不通过

请严格按照以下JSON格式返回结果，不要包含其他内容：
{"result": "pass"或"fail", "difference": "差异说明，通过时为空字符串"}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: `请对比以下化妆品${side_name || '产品'}的标样图片和首件图片，判断是否通过。` },
          {
            type: 'image_url',
            image_url: {
              url: standardFullUrl,
              detail: 'high',
            },
          },
          {
            type: 'image_url',
            image_url: {
              url: actualFullUrl,
              detail: 'high',
            },
          },
        ],
      },
    ] as any;

    const response = await client.invoke(messages, {
      model: 'doubao-seed-2-0-mini-260215',
      temperature: 0.2,
    });

    // Parse the response to extract JSON
    let result = { result: 'pass', difference: '' };
    try {
      const content = response.content.trim();
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*?"result"\s*:\s*"(pass|fail)"[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        result = {
          result: parsed.result === 'fail' ? 'fail' : 'pass',
          difference: parsed.difference || '',
        };
      } else {
        // If no JSON found, try to determine from text
        const isFail = content.includes('不通过') || content.includes('不一致') || content.includes('fail');
        result = {
          result: isFail ? 'fail' : 'pass',
          difference: isFail ? content.substring(0, 200) : '',
        };
      }
    } catch {
      // If parsing fails, default to pass
      result = {
        result: 'pass',
        difference: '',
      };
    }

    return NextResponse.json({
      success: true,
      result: result.result,
      difference: result.difference,
    });
  } catch (error) {
    console.error('Image comparison error:', error);
    return NextResponse.json(
      { error: '图片比对失败，请重试' },
      { status: 500 }
    );
  }
}
