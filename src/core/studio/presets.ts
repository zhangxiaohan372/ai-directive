/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudioCaseData } from './types';
import { SUSPECTS, CLUES } from '../../data/caseData';

export const PRESET_STUDIO_CASES: Record<string, StudioCaseData> = {
  midnight_gallery: {
    id: 'midnight_gallery',
    title: '午夜画廊：锁闭之谜',
    tagline: '22:15，所有人都看见他走进修复室；没有人看见他出来。',
    summary:
      '午夜 22:30，画廊策展人陈默在密封的文物修复室内遇害。中央展厅酒会人声鼎沸，排风窗高悬且窗销锈蚀，监控室在关键的二十分钟发生神秘录制断档。',
    difficulty: '进阶',
    murderWindow: {
      start: '22:15',
      end: '22:20',
    },
    victim: {
      name: '陈默',
      identity: '画廊总策展人、独立艺术鉴赏家',
      causeOfDeath: '钝器重击后脑导致颅脑创伤休克，遇害时间推断为 22:15-22:20',
      foundLocation: '文物修复室工作台后侧地面',
    },
    trueCulpritId: 'xu_ning',
    coreTrick:
      '利用怀表倒拨 20 分钟并制造内部撞击声，诱导众人产生「22:15 仍有活人声响」的死前假象；实则于 21:55 即已下毒迷晕并重击陈默，随后用备用门禁卡锁死大门脱身。',
    suspects: SUSPECTS,
    clues: CLUES,
    timeline: [
      {
        time: '21:30',
        actor: '周衡',
        location: '中央艺术展厅',
        action: '与多位赞助商推杯换盏，签署意向赞助备忘录',
        isVerified: true,
      },
      {
        time: '21:45',
        actor: '林岚',
        location: '中央艺术展厅',
        action: '与死者陈默在香槟吧台旁爆发剧烈低语争执',
        isVerified: true,
      },
      {
        time: '21:55',
        actor: '许宁',
        location: '文物修复室',
        action: '受陈默传召送入加急调色样本与两份署名装裱协议',
        isVerified: false,
        note: '实际实施致命袭击并倒拨怀表时间',
      },
      {
        time: '22:00',
        actor: '赵磊',
        location: '安保监控室',
        action: '监控主机信号发生偶发性雪花抖动，赵磊离岗前往配电室检查',
        isVerified: true,
      },
      {
        time: '22:15',
        actor: '陈默',
        location: '文物修复室',
        action: '众人听到修复室内传出画架翻倒的巨响与玻璃碎裂声（实为定时装置触发）',
        isVerified: false,
        note: '虚构的遇害时间节点',
      },
      {
        time: '22:25',
        actor: '许宁',
        location: '中央艺术展厅',
        action: '在人群中高调帮投资人周衡更换倒洒的香槟杯',
        isVerified: true,
      },
      {
        time: '22:30',
        actor: '赵磊',
        location: '文物修复室',
        action: '夜间常规巡逻发现房门反锁，使用应急钥匙开门发现遗体并拉响警报',
        isVerified: true,
      },
    ],
  },

  snow_manor: {
    id: 'snow_manor',
    title: '暴风雪山庄：钟楼倒错案',
    tagline: '风雪封锁的孤岛庄园，古老报时钟在敲响十响后逆转三周。',
    summary:
      '暴风雪压垮了进山索道，山庄主人霍华德公爵倒在钟楼顶层齿轮箱旁。现场窗户从内部插死，门锁为十五世纪锻铁巨锁，唯一的钥匙插在公爵贴身西装口袋中。',
    difficulty: '硬核硬推',
    murderWindow: {
      start: '21:45',
      end: '22:15',
    },
    victim: {
      name: '霍华德公爵',
      identity: '山庄主人、钟表机械收藏家',
      causeOfDeath: '机械重锤索绳绞勒',
      foundLocation: '钟楼顶层大机芯齿轮槽前',
    },
    trueCulpritId: 'xu_ning',
    coreTrick:
      '利用钟摆重锤下坠的机械动力与重力拉线，在公爵死后牵引铁锁销子从门缝外拉上内栓，伪造纯机械密室；利用报时齿轮卡滞伪造假的不在场证明。',
    suspects: SUSPECTS,
    clues: CLUES,
    timeline: [
      {
        time: '21:00',
        actor: '公爵',
        location: '钟楼机芯室',
        action: '独自登楼为百年古钟上弦',
        isVerified: true,
      },
      {
        time: '21:30',
        actor: '周衡',
        location: '暖炉壁炉客厅',
        action: '与客人们品饮热红酒，谈论索道维修',
        isVerified: true,
      },
      // INTENTIONAL PARADOX 1: Spatiotemporal collision
      {
        time: '21:50',
        actor: '许宁',
        location: '地下酒窖',
        action: '声称正在为公爵挑选年份香槟（但走廊目击却记录他在三楼钟楼）',
        isVerified: false,
      },
      {
        time: '21:50',
        actor: '许宁',
        location: '钟楼机芯室走廊',
        action: '管家声称目击其手持铜丝滑轮穿过旋转楼梯',
        isVerified: true,
      },
      // INTENTIONAL PARADOX 2: Lock paradox
      {
        time: '21:40',
        actor: '钟楼大门',
        location: '钟楼底层',
        action: '防风铁门已被机械锁死，唯一钥匙在公爵口袋',
        isVerified: true,
      },
      {
        time: '22:00',
        actor: '许宁',
        location: '钟楼机芯室',
        action: '未经门禁钥匙直接进入密室放置误导线索',
        isVerified: false,
      },
      {
        time: '22:15',
        actor: '钟声报时',
        location: '整座山庄',
        action: '钟楼敲响十次，全庄园听闻',
        isVerified: true,
      },
    ],
  },

  yacht_poison: {
    id: 'yacht_poison',
    title: '私人游艇：消失的凶器与毒物',
    tagline: '公海夜航，平静海面下暗涌着致命神经毒素的倒计时。',
    summary:
      '停泊在公海海湾的豪华游艇「塞壬号」上，科技新贵在甲板日光浴躺椅上突发中毒抽搐身亡。所有随行人员身上均未搜出毒药瓶与注射针具，海水检测显示周围水质未有抛弃痕迹。',
    difficulty: '进阶',
    murderWindow: {
      start: '22:00',
      end: '22:20',
    },
    victim: {
      name: '顾天成',
      identity: '科技独角兽创始人、跨国投资客',
      causeOfDeath: '河豚毒素结晶混合挥发剂，经由雪茄吸入',
      foundLocation: '游艇后甲板观星躺椅',
    },
    trueCulpritId: 'xu_ning',
    coreTrick:
      '将极微量神经毒素冷凝附着于定制雪茄吸嘴内壁滤芯，由点燃时的高温气化触发；凶手无须在遇害瞬间在场，制造完美的跨海域不在场证明。',
    suspects: SUSPECTS,
    clues: CLUES,
    timeline: [
      {
        time: '20:30',
        actor: '林岚',
        location: '主舱沙龙',
        action: '为被害人送上定制手工雪茄盒',
        isVerified: true,
      },
      {
        time: '21:15',
        actor: '顾天成',
        location: '后甲板',
        action: '独坐观星躺椅，点燃第一支雪茄',
        isVerified: true,
      },
      {
        time: '21:45',
        actor: '周衡',
        location: '主驾驶台',
        action: '与船长核对航线与自动巡航参数',
        isVerified: true,
      },
      {
        time: '22:10',
        actor: '许宁',
        location: '主舱沙龙',
        action: '为宾客调制餐后鸡尾酒，表现得体自若',
        isVerified: true,
      },
      {
        time: '22:25',
        actor: '赵磊',
        location: '后甲板',
        action: '夜巡甲板发现顾天成已无脉搏与呼吸',
        isVerified: true,
      },
    ],
  },
};
