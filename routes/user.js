const supabase = require('../supabase');

module.exports = {
    name: 'user-routes',
    register: async function (server, options) {
        const db = options.supabase || supabase;

        server.route({
            method: 'POST',
            path: '/users/profile-picture',
            options: {
                auth: { strategy: 'jwt_auth_optional', mode: 'required' },
                payload: {
                    output: 'stream',
                    parse: true,
                    allow: 'multipart/form-data',
                    maxBytes: 5 * 1024 * 1024,
                    multipart: true,
                },
            },
            handler: async (request, h) => {
                const userId = request.auth.credentials.id;
                const file = request.payload.profilePicture;

                if (!file) {
                    return h.response({ message: 'No file uploaded.' }).code(400);
                }

                const fileExtension = file.hapi.filename.split('.').pop();
                const fileName = `user_${userId}_${Date.now()}.${fileExtension}`;
                const filePath = `${userId}/${fileName}`;

                try {
                    const { data: uploadData, error: uploadError } = await db.storage
                        .from('profile-pictures')
                        .upload(filePath, file._data || file, {
                            cacheControl: '3600',
                            upsert: true,
                            contentType: file.hapi.headers['content-type'],
                        });

                    if (uploadError) {
                        console.error('Supabase Storage upload error:', uploadError);
                        return h.response({ message: 'Failed to upload profile picture to storage.', error: uploadError.message }).code(500);
                    }

                    const { data: publicUrlData } = db.storage
                        .from('profile-pictures')
                        .getPublicUrl(filePath);
                    
                    if (!publicUrlData || !publicUrlData.publicUrl) {
                         console.error('Failed to get public URL for:', filePath);
                         return h.response({ message: 'File uploaded but failed to get public URL.' }).code(500);
                    }
                    const avatarUrl = publicUrlData.publicUrl;

                    const { data: updatedUser, error: updateError } = await db
                        .from('users')
                        .update({ avatar_url: avatarUrl })
                        .eq('id', userId)
                        .select('id, username, email, name, avatar_url')
                        .single();

                    if (updateError) {
                        console.error('Supabase user update error:', updateError);
                        return h.response({ message: 'Failed to update user profile with new picture.', error: updateError.message }).code(500);
                    }

                    return h.response({ 
                        message: 'Profile picture uploaded successfully.', 
                        avatarUrl: avatarUrl,
                        user: updatedUser
                    }).code(200);

                } catch (err) {
                    console.error('Error processing profile picture upload:', err);
                    return h.response({ message: 'Internal server error during upload.' }).code(500);
                }
            },
        });
    },
};