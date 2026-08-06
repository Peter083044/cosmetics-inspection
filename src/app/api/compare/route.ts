import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getCurrentUser } from '@/lib/auth';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Max pixels for the vision model (6000x6000 = 36M pixels)
const MAX_PIXELS = 36_000_000;

async function resizeImageToBase64(imageUrl: string): Promise<string> {
  let imageBuffer: Buffer;

  if (imageUrl.startsWith('http')) {
    // Download remote image
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuffer);
  } else {
    // Local file
    const filePath = path.join(process.env.COZE_WORKSPACE_PATH || '/workspace/projects', 'public', imageUrl);
    imageBuffer = fs.readFileSync(filePath);
  }

  // Get image metadata
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 1;
  const height = metadata.height || 1;
  const totalPixels = width * height;

  // Always resize to reasonable size for AI comparison (max 1280px on longest side)
  // This handles high-res phone/tablet camera photos (often 4000+ pixels)
  const MAX_DIMENSION = 1280;
  const needsResize = totalPixels > MAX_PIXELS || width > MAX_DIMENSION || height > MAX_DIMENSION;
  
  if (needsResize) {
    imageBuffer = await sharp(imageBuffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  // Convert to base64 data URL
  const base64 = imageBuffer.toString('base64');
  const mimeType = 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

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

    // Resize images and convert to base64 to avoid pixel limit issues
    const [standardBase64, actualBase64] = await Promise.all([
      resizeImageToBase64(standard_url),
      resizeImageToBase64(actual_url),
    ]);

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = `你是一个严格的化妆品生产过程首件核对专家。你的任务是对比标样图片和首件实物图片，判断它们是否一致。

请从以下几个方面进行严格对比：
1. 颜色：整体颜色、色调、饱和度是否一致（注意色差）
2. 外观：形状、大小、表面质感、纹理是否一致
3. 标识：文字内容、字体、图案、logo、排版是否完全一致
4. 包装：包装形式、材质、封口是否一致
5. 缺陷：首件是否有划痕、污渍、变形、破损等缺陷

判定标准：
- 如果两张图片明显是**不同的物品**或**完全不同的产品**，必须判定为"fail"
- 如果颜色、外观、标识有任何明显差异，判定为"fail"
- 批号、生产日期等可变信息可以忽略
- 拍摄角度、光线导致的细微差别可以忽略
- 只有当两张图片几乎完全一致时，才判定为"pass"

请严格按照以下JSON格式返回结果，不要包含其他内容：
{"result": "pass"或"fail", "difference": "差异说明，通过时为空字符串，不通过时详细说明差异"}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: `请对比以下化妆品${side_name || '产品'}的标样图片和首件图片，判断是否通过。` },
          {
            type: 'image_url',
            image_url: {
              url: standardBase64,
              detail: 'high',
            },
          },
          {
            type: 'image_url',
            image_url: {
              url: actualBase64,
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
      ...result,
    });
  } catch (error: any) {
    console.error('Image comparison error:', error);
    return NextResponse.json(
      { error: `图片比对失败: ${error.message || '请重试'}` },
      { status: 500 }
    );
  }
}
