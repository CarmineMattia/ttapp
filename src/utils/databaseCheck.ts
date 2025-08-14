import { supabase } from '@/lib/supabase'

export async function checkAndFixUserProfiles() {
  console.log('🔍 Checking user profiles in database...')
  
  try {
    // First, let's see what's in the employees table
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
    
    if (employeesError) {
      console.error('❌ Error fetching employees:', employeesError)
      return
    }
    
    console.log('📊 Current employees in database:', employees)
    
    // Check for records with missing surname or profile_image
    const incompleteProfiles = employees?.filter(emp => 
      !emp.surname || emp.surname === '' || !emp.profile_image
    )
    
    if (incompleteProfiles && incompleteProfiles.length > 0) {
      console.log('⚠️ Found incomplete profiles:', incompleteProfiles)
      
      // Fix incomplete profiles
      for (const profile of incompleteProfiles) {
        const updateData: any = {}
        
        if (!profile.surname || profile.surname === '') {
          updateData.surname = 'Name'
        }
        
        if (!profile.profile_image) {
          updateData.profile_image = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${profile.id}`
        }
        
        if (Object.keys(updateData).length > 0) {
          console.log(`🔧 Fixing profile for ${profile.email}:`, updateData)
          
          const { error: updateError } = await supabase
            .from('employees')
            .update(updateData)
            .eq('id', profile.id)
          
          if (updateError) {
            console.error(`❌ Error updating profile for ${profile.email}:`, updateError)
          } else {
            console.log(`✅ Successfully updated profile for ${profile.email}`)
          }
        }
      }
    } else {
      console.log('✅ All profiles look complete!')
    }
    
  } catch (error) {
    console.error('❌ Error checking profiles:', error)
  }
}

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('❌ Error fetching user profile:', error)
      return null
    }
    
    console.log('👤 User profile:', data)
    return data
  } catch (error) {
    console.error('❌ Exception fetching user profile:', error)
    return null
  }
} 