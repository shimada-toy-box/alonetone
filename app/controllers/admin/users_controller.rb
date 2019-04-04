module Admin
  class UsersController < Admin::BaseController
    before_action :set_user, only: %i[delete restore]

    def index
      scope = User.only_deleted if permitted_params[:filter_by] == 'deleted'
      scope ||= User.with_deleted.recent

      @pagy, @users = pagy(scope)
    end

    # should we rescue/display any error that occured to admin user
    def delete
      @user.soft_delete_relations
      @user.enqueue_real_destroy_job
      @user.soft_delete
      redirect_back(fallback_location: root_path)
    end

    def restore
      @user.restore
      @user.restore_relations
    end

    private

    def permitted_params
      params.permit(:filter_by)
    end

    def set_user
      @user = User.with_deleted.find_by_login(params[:id])
    end
  end
end
