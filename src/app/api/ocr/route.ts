import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const MAX_DIMENSION = 1280;

async function imageToBase64(imageUrl: string): Promise<string> {
  let imageBuffer: Buffer;

  if (imageUrl.startsWith('http')) {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuffer);
  } else {
    const filePath = path.join(process.env.COZE_WORKSPACE_PATH || '/workspace/projects', 'public', imageUrl);
    imageBuffer = fs.readFileSync(filePath);
  }

  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 1;
  const height = metadata.height || 1;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    imageBuffer = await sharp(imageBuffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  const base64 = imageBuffer.toString('base64');
  return `data:image/jpeg;base64,${base64}`;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }

    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ success: false, message: '缺少图片 URL' }, { status: 400 });
    }

    const base64Image = await imageToBase64(imageUrl);

    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VOLCES_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'doubao-seed-2-0-mini-260215',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请识别这张工单图片中的产品名称和产品代码。只返回 JSON 格式，包含 product_name 和 product_code 两个字段。如果找不到某个字段，返回空字符串。',
              },
              {
                type: 'image_url',
                image_url: { url: base64Image, detail: 'high' },
              },
            ],
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    let result = { product_name: '', product_code: '' };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If parsing fails, return empty values
    }

    return NextResponse.json({
      success: true,
      data: {
        product_name: result.product_name || '',
        product_code: result.product_code || '',
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message || '识别失败',
    }, { status: 500 });
  }
}
