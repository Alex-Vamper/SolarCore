export interface VoiceCommand {
  id?: string;
  command_category: 'system_control' | 'lighting_control' | 'safety_security' | 'energy_management' | 'information_interaction';
  command_name: string;
  keywords: string[];
  response: string;
  action_type?: string;
}

export class VoiceCommandService {
  static getDefaultCommands(): VoiceCommand[] {
    return [
      {
        command_category: 'system_control',
        command_name: 'status_check',
        keywords: ['status', 'how is everything', 'system report'],
        response: 'All systems are operating normally. Energy is running efficiently and safety systems are active.',
        action_type: 'status_report'
      },
      {
        command_category: 'lighting_control',
        command_name: 'lights_on',
        keywords: ['turn on lights', 'lights on', 'illuminate'],
        response: 'Turning on the lights in the main areas.',
        action_type: 'lighting_control'
      },
      {
        command_category: 'energy_management',
        command_name: 'energy_report',
        keywords: ['energy usage', 'power consumption', 'battery level'],
        response: 'Current energy usage is optimal. Solar panels are generating efficiently.',
        action_type: 'energy_report'
      }
    ];
  }
}

// Keep backward compatibility
export const VoiceCommand = VoiceCommandService;